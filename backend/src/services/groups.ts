import type { Prisma } from '../../generated/prisma/client';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import type { CreateGroupInput, ListGroupsQuery, UpdateGroupInput } from '../schemas/groups';

/** Estados de membresía que ocupan un cupo y dan acceso a los datos de pago (A.5, A.7) */
const OCCUPYING = ['APPROVED', 'ACTIVE'] as const;

const groupInclude = {
  service: true,
  owner: { select: { id: true, name: true } },
} satisfies Prisma.GroupInclude;

type GroupWithRelations = Prisma.GroupGetPayload<{ include: typeof groupInclude }>;

async function occupiedSlots(groupIds: string[]) {
  const rows = await prisma.membership.groupBy({
    by: ['groupId'],
    where: { groupId: { in: groupIds }, status: { in: [...OCCUPYING] } },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.groupId, r._count._all]));
}

/** Nunca incluye `payoutDetail`: se agrega solo en el detalle, según permisos. */
function toSummary(group: GroupWithRelations, occupied: number) {
  const { payoutDetail: _payoutDetail, ...rest } = group;
  return { ...rest, occupiedSlots: occupied, availableSlots: Math.max(group.slots - occupied, 0) };
}

export async function createGroup(ownerId: string, input: CreateGroupInput) {
  const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
  if (!service) throw new AppError('validation/error', [{ field: 'serviceId', message: 'Servicio no existe' }]);
  if (input.slots > service.maxMembers - 1) {
    throw new AppError('validation/error', [
      { field: 'slots', message: `Máximo ${service.maxMembers - 1} cupos para este servicio` },
    ]);
  }
  const group = await prisma.group.create({ data: { ...input, ownerId }, include: groupInclude });
  return { ...toSummary(group, 0), payoutDetail: group.payoutDetail };
}

export async function listGroups(userId: string, q: ListGroupsQuery) {
  const mineFilter: Prisma.GroupWhereInput = {
    OR: [{ ownerId: userId }, { memberships: { some: { userId, status: { in: ['PENDING', 'APPROVED', 'ACTIVE'] } } } }],
  };
  const and: Prisma.GroupWhereInput[] = [];
  if (q.mine) and.push(mineFilter);
  if (q.excludeMine) and.push({ NOT: mineFilter });
  if (q.search) {
    and.push({
      OR: [
        { title: { contains: q.search, mode: 'insensitive' } },
        { description: { contains: q.search, mode: 'insensitive' } },
      ],
    });
  }

  const where: Prisma.GroupWhereInput = {
    // Con `mine` se listan todos los estados salvo que se pida uno
    ...(q.status ? { status: q.status } : q.mine ? {} : { status: 'OPEN' }),
    ...(q.serviceId ? { serviceId: q.serviceId } : {}),
    ...(q.minPrice !== undefined || q.maxPrice !== undefined
      ? { pricePerMember: { gte: q.minPrice, lte: q.maxPrice } }
      : {}),
    ...(and.length ? { AND: and } : {}),
  };

  const [total, groups] = await Promise.all([
    prisma.group.count({ where }),
    prisma.group.findMany({
      where,
      include: groupInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
  ]);
  const occupied = await occupiedSlots(groups.map((g) => g.id));

  return {
    data: groups.map((g) => toSummary(g, occupied.get(g.id) ?? 0)),
    pagination: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) },
  };
}

export async function getGroupDetail(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId }, include: groupInclude });
  if (!group) throw new AppError('general/not-found');

  const [occupied, membership] = await Promise.all([
    occupiedSlots([groupId]),
    prisma.membership.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { id: true, status: true },
    }),
  ]);

  const isOwner = group.ownerId === userId;
  const canSeePayout = isOwner || (!!membership && (OCCUPYING as readonly string[]).includes(membership.status));

  return {
    ...toSummary(group, occupied.get(groupId) ?? 0),
    isOwner,
    myMembership: membership,
    ...(canSeePayout ? { payoutDetail: group.payoutDetail } : {}),
  };
}

async function getOwnedGroup(groupId: string, userId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId }, include: { service: true } });
  if (!group) throw new AppError('general/not-found');
  if (group.ownerId !== userId) throw new AppError('group/not-owner');
  return group;
}

export async function updateGroup(groupId: string, userId: string, input: UpdateGroupInput) {
  const group = await getOwnedGroup(groupId, userId);
  if (group.status === 'CLOSED') throw new AppError('group/closed');

  if (input.slots !== undefined) {
    if (input.slots > group.service.maxMembers - 1) {
      throw new AppError('validation/error', [
        { field: 'slots', message: `Máximo ${group.service.maxMembers - 1} cupos para este servicio` },
      ]);
    }
    const occupied = (await occupiedSlots([groupId])).get(groupId) ?? 0;
    if (input.slots < occupied) throw new AppError('group/slots-exceeded');
  }

  await prisma.group.update({ where: { id: groupId }, data: input });
  return getGroupDetail(groupId, userId);
}

export async function closeGroup(groupId: string, userId: string) {
  const group = await getOwnedGroup(groupId, userId);
  if (group.status === 'CLOSED') throw new AppError('group/closed');

  await prisma.$transaction(async (tx) => {
    const marked = await tx.paymentCycle.count({
      where: { status: 'MARKED_PAID', membership: { groupId } },
    });
    if (marked > 0) throw new AppError('group/has-pending-payments');

    await tx.paymentCycle.updateMany({
      where: { status: { in: ['PENDING', 'OVERDUE'] }, membership: { groupId } },
      data: { status: 'CANCELLED' },
    });
    await tx.group.update({ where: { id: groupId }, data: { status: 'CLOSED' } });
  });

  return getGroupDetail(groupId, userId);
}
