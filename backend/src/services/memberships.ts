import { Prisma } from '../../generated/prisma/client';
import { dueDateFor, firstPeriod, nextCycleEnd } from '../lib/dates';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import type { ApproveInput, RemoveInput } from '../schemas/memberships';
import { notify } from './notifications';

const OCCUPYING = ['APPROVED', 'ACTIVE'] as const;
/** Cuotas vencidas consecutivas necesarias para poder expulsar (B.6) */
const OVERDUE_FOR_REMOVAL = 2;

const membershipInclude = {
  group: { include: { service: { select: { name: true } } } },
  user: { select: { id: true, name: true } },
} satisfies Prisma.MembershipInclude;

async function getMembership(id: string) {
  const membership = await prisma.membership.findUnique({ where: { id }, include: membershipInclude });
  if (!membership) throw new AppError('membership/not-found');
  return membership;
}

async function getOwnedMembership(id: string, userId: string) {
  const membership = await getMembership(id);
  if (membership.group.ownerId !== userId) throw new AppError('group/not-owner');
  return membership;
}

async function getOwnMembership(id: string, userId: string) {
  const membership = await getMembership(id);
  if (membership.userId !== userId) throw new AppError('general/forbidden');
  return membership;
}

/** Bloquea la fila del grupo para serializar aprobaciones concurrentes (A.5). */
async function lockGroup(tx: Prisma.TransactionClient, groupId: string) {
  await tx.$queryRaw`SELECT id FROM "Group" WHERE id = ${groupId} FOR UPDATE`;
}

/** Si el grupo estaba completo y se liberó un cupo, vuelve a abrirse. */
async function reopenIfFull(tx: Prisma.TransactionClient, groupId: string) {
  await tx.group.updateMany({ where: { id: groupId, status: 'FULL' }, data: { status: 'OPEN' } });
}

function toMember(m: {
  id: string;
  status: string;
  joinedAt: Date | null;
  user: { id: string; name: string };
  firstAmount?: number | null;
}) {
  return { id: m.id, status: m.status, joinedAt: m.joinedAt, user: m.user, firstAmount: m.firstAmount };
}

export async function joinGroup(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new AppError('general/not-found');
  if (group.ownerId === userId) throw new AppError('general/forbidden');
  if (group.status === 'FULL') throw new AppError('group/full');
  if (group.status !== 'OPEN') throw new AppError('group/closed');

  const existing = await prisma.membership.findUnique({ where: { groupId_userId: { groupId, userId } } });
  if (existing && existing.status !== 'REJECTED') throw new AppError('group/already-member');

  const occupied = await prisma.membership.count({ where: { groupId, status: { in: [...OCCUPYING] } } });
  if (occupied >= group.slots) throw new AppError('group/full');

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } });

  try {
    return await prisma.$transaction(async (tx) => {
      // Una solicitud rechazada puede volver a enviarse
      const membership = existing
        ? await tx.membership.update({
            where: { id: existing.id },
            data: { status: 'PENDING', firstAmount: null },
          })
        : await tx.membership.create({ data: { groupId, userId } });
      await notify(
        tx,
        group.ownerId,
        'JOIN_REQUEST',
        'Nueva solicitud',
        `${user.name} quiere unirse a "${group.title}"`,
        { groupId, membershipId: membership.id },
      );
      return membership;
    });
  } catch (e) {
    // Dos solicitudes simultáneas del mismo usuario chocan con @@unique([groupId, userId])
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new AppError('group/already-member');
    }
    throw e;
  }
}

/**
 * El administrador ve todas las membresías vigentes (incluidas las solicitudes);
 * los miembros `APPROVED`/`ACTIVE` solo ven a los miembros activos.
 */
export async function listMembers(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new AppError('general/not-found');

  const isOwner = group.ownerId === userId;
  if (!isOwner) {
    const mine = await prisma.membership.findUnique({ where: { groupId_userId: { groupId, userId } } });
    if (!mine || !(OCCUPYING as readonly string[]).includes(mine.status)) throw new AppError('general/forbidden');
  }

  const rows = await prisma.membership.findMany({
    where: { groupId, status: { in: isOwner ? ['PENDING', 'APPROVED', 'ACTIVE'] : ['ACTIVE'] } },
    include: { user: { select: { id: true, name: true } } },
    orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }],
  });

  return rows.map((m) => toMember({ ...m, firstAmount: isOwner ? m.firstAmount : undefined }));
}

export async function approveMembership(id: string, userId: string, input: ApproveInput) {
  const current = await getOwnedMembership(id, userId);
  if (current.status !== 'PENDING') throw new AppError('membership/invalid-transition');
  if (current.group.status === 'CLOSED') throw new AppError('group/closed');

  return prisma.$transaction(async (tx) => {
    await lockGroup(tx, current.groupId);

    const group = await tx.group.findUniqueOrThrow({ where: { id: current.groupId } });
    const occupied = await tx.membership.count({ where: { groupId: group.id, status: { in: [...OCCUPYING] } } });
    if (occupied >= group.slots) throw new AppError('group/slots-exceeded');

    // `updateMany` con el estado esperado evita aprobar dos veces la misma solicitud
    const updated = await tx.membership.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: 'APPROVED', firstAmount: input.firstAmount ?? null },
    });
    if (updated.count === 0) throw new AppError('membership/invalid-transition');

    if (occupied + 1 >= group.slots) {
      await tx.group.update({ where: { id: group.id }, data: { status: 'FULL' } });
    }

    await notify(
      tx,
      current.userId,
      'MEMBERSHIP_APPROVED',
      'Solicitud aprobada',
      `Te aprobaron en "${group.title}". Confirma que ya tienes acceso al servicio.`,
      { groupId: group.id, membershipId: id },
    );
    return tx.membership.findUniqueOrThrow({ where: { id } });
  });
}

export async function rejectMembership(id: string, userId: string) {
  const current = await getOwnedMembership(id, userId);
  if (current.status !== 'PENDING') throw new AppError('membership/invalid-transition');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.membership.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'REJECTED' } });
    if (updated.count === 0) throw new AppError('membership/invalid-transition');
    await notify(
      tx,
      current.userId,
      'MEMBERSHIP_REJECTED',
      'Solicitud rechazada',
      `El administrador de "${current.group.title}" rechazó tu solicitud`,
      { groupId: current.groupId, membershipId: id },
    );
    return tx.membership.findUniqueOrThrow({ where: { id } });
  });
}

export async function confirmAccess(id: string, userId: string, now = new Date()) {
  const current = await getOwnMembership(id, userId);
  if (current.status !== 'APPROVED') throw new AppError('membership/invalid-transition');
  const { group } = current;

  const period = firstPeriod(now, group.paymentDay);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.membership.updateMany({
      where: { id, status: 'APPROVED' },
      data: { status: 'ACTIVE', joinedAt: now },
    });
    if (updated.count === 0) throw new AppError('membership/invalid-transition');

    await tx.paymentCycle.create({
      data: {
        membershipId: id,
        period,
        amount: current.firstAmount ?? group.pricePerMember,
        dueDate: dueDateFor(period, group.paymentDay),
      },
    });
    await notify(
      tx,
      group.ownerId,
      'ACCESS_CONFIRMED',
      'Acceso confirmado',
      `${current.user.name} confirmó su acceso a "${group.title}"`,
      { groupId: group.id, membershipId: id },
    );
    return tx.membership.findUniqueOrThrow({ where: { id } });
  });
}

export async function leaveMembership(id: string, userId: string, now = new Date()) {
  const current = await getOwnMembership(id, userId);
  if (!(OCCUPYING as readonly string[]).includes(current.status)) throw new AppError('membership/invalid-transition');

  const leavesAt = nextCycleEnd(now, current.group.paymentDay);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.membership.updateMany({
      where: { id, status: { in: [...OCCUPYING] } },
      data: { status: 'LEFT', leavesAt },
    });
    if (updated.count === 0) throw new AppError('membership/invalid-transition');

    // La cuota del ciclo vigente se conserva; las de ciclos posteriores se cancelan
    await tx.paymentCycle.updateMany({
      where: { membershipId: id, status: 'PENDING', dueDate: { gte: leavesAt } },
      data: { status: 'CANCELLED' },
    });
    await reopenIfFull(tx, current.groupId);
    return tx.membership.findUniqueOrThrow({ where: { id } });
  });
}

export async function removeMember(id: string, userId: string, input: RemoveInput = {}) {
  const current = await getOwnedMembership(id, userId);
  if (current.status !== 'ACTIVE') throw new AppError('membership/invalid-transition');

  const cycles = await prisma.paymentCycle.findMany({
    where: { membershipId: id, status: { not: 'CANCELLED' } },
    orderBy: { dueDate: 'asc' },
    select: { status: true },
  });
  // "Consecutivas": dos cuotas vencidas seguidas, sin una cuota pagada en medio
  const eligible = cycles.some(
    (c, i) => i + 1 >= OVERDUE_FOR_REMOVAL && cycles.slice(i + 1 - OVERDUE_FOR_REMOVAL, i + 1).every((x) => x.status === 'OVERDUE'),
  );
  if (!eligible) throw new AppError('membership/not-eligible-removal');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.membership.updateMany({ where: { id, status: 'ACTIVE' }, data: { status: 'REMOVED' } });
    if (updated.count === 0) throw new AppError('membership/invalid-transition');

    await tx.paymentCycle.updateMany({
      where: { membershipId: id, status: { in: ['PENDING', 'OVERDUE'] } },
      data: { status: 'CANCELLED' },
    });
    await reopenIfFull(tx, current.groupId);
    await notify(
      tx,
      current.userId,
      'MEMBER_REMOVED',
      'Te removieron del grupo',
      `El administrador te removió de "${current.group.title}"${input.reason ? `: ${input.reason}` : ''}`,
      { groupId: current.groupId, membershipId: id },
    );
    return tx.membership.findUniqueOrThrow({ where: { id } });
  });
}
