import type { Prisma } from '../../generated/prisma/client';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import type { ListPaymentsQuery, MarkPaidInput, RejectPaymentInput } from '../schemas/payments';
import { notify } from './notifications';

/** Estados desde los que el miembro puede marcar como pagado (B.7: `OVERDUE` es pago tardío) */
const MARKABLE = ['PENDING', 'OVERDUE'] as const;
const LIST_LIMIT = 200;

const paymentInclude = {
  membership: {
    include: {
      user: { select: { id: true, name: true } },
      group: {
        select: {
          id: true,
          title: true,
          ownerId: true,
          payoutMethod: true,
          payoutDetail: true,
          service: { select: { name: true } },
        },
      },
    },
  },
} satisfies Prisma.PaymentCycleInclude;

type PaymentWithRelations = Prisma.PaymentCycleGetPayload<{ include: typeof paymentInclude }>;

/** `payoutDetail` solo se expone en el detalle (al pagador y al administrador). */
function toPayment(p: PaymentWithRelations, opts: { withPayout?: boolean } = {}) {
  const { membership, ...cycle } = p;
  const { payoutDetail, ownerId: _ownerId, ...group } = membership.group;
  return {
    ...cycle,
    group,
    member: membership.user,
    ...(opts.withPayout ? { payoutDetail } : {}),
  };
}

async function getPayment(id: string) {
  const payment = await prisma.paymentCycle.findUnique({ where: { id }, include: paymentInclude });
  if (!payment) throw new AppError('payment/not-found');
  return payment;
}

async function getOwnedPayment(id: string, userId: string) {
  const payment = await getPayment(id);
  if (payment.membership.group.ownerId !== userId) throw new AppError('group/not-owner');
  return payment;
}

export async function listMyPayments(userId: string, q: ListPaymentsQuery = {}) {
  const rows = await prisma.paymentCycle.findMany({
    where: { membership: { userId }, ...(q.status ? { status: q.status } : {}) },
    include: paymentInclude,
    orderBy: [{ dueDate: 'desc' }, { id: 'asc' }],
    take: LIST_LIMIT,
  });
  return rows.map((p) => toPayment(p));
}

export async function listGroupPayments(groupId: string, userId: string, q: ListPaymentsQuery = {}) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new AppError('general/not-found');
  if (group.ownerId !== userId) throw new AppError('group/not-owner');

  const rows = await prisma.paymentCycle.findMany({
    where: { membership: { groupId }, ...(q.status ? { status: q.status } : {}) },
    include: paymentInclude,
    orderBy: [{ dueDate: 'desc' }, { id: 'asc' }],
    take: LIST_LIMIT,
  });
  return rows.map((p) => toPayment(p));
}

export async function getPaymentDetail(id: string, userId: string) {
  const payment = await getPayment(id);
  const isOwner = payment.membership.group.ownerId === userId;
  if (!isOwner && payment.membership.userId !== userId) throw new AppError('general/forbidden');
  return toPayment(payment, { withPayout: true });
}

export async function markAsPaid(id: string, userId: string, input: MarkPaidInput = {}, now = new Date()) {
  const current = await getPayment(id);
  if (current.membership.userId !== userId) throw new AppError('general/forbidden');
  if (current.status === 'CONFIRMED') throw new AppError('payment/already-confirmed');
  if (!(MARKABLE as readonly string[]).includes(current.status)) throw new AppError('payment/invalid-transition');

  const { group, user } = current.membership;

  return prisma.$transaction(async (tx) => {
    // `updateMany` con el estado esperado: una doble petición solo se aplica una vez
    const updated = await tx.paymentCycle.updateMany({
      where: { id, status: { in: [...MARKABLE] } },
      data: { status: 'MARKED_PAID', reference: input.reference ?? null, markedPaidAt: now, rejectionReason: null },
    });
    if (updated.count === 0) throw new AppError('payment/invalid-transition');

    await notify(
      tx,
      group.ownerId,
      'PAYMENT_MARKED_PAID',
      'Pago por confirmar',
      `${user.name} marcó como pagada su cuota de "${group.title}"`,
      { groupId: group.id, paymentId: id },
    );
    return tx.paymentCycle.findUniqueOrThrow({ where: { id } });
  });
}

export async function confirmPayment(id: string, userId: string, now = new Date()) {
  const current = await getOwnedPayment(id, userId);
  if (current.status === 'CONFIRMED') throw new AppError('payment/already-confirmed');
  if (current.status !== 'MARKED_PAID') throw new AppError('payment/invalid-transition');

  const { group } = current.membership;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.paymentCycle.updateMany({
      where: { id, status: 'MARKED_PAID' },
      data: { status: 'CONFIRMED', confirmedAt: now },
    });
    if (updated.count === 0) throw new AppError('payment/invalid-transition');

    await notify(
      tx,
      current.membership.userId,
      'PAYMENT_CONFIRMED',
      'Pago confirmado',
      `El administrador confirmó tu pago de "${group.title}"`,
      { groupId: group.id, paymentId: id },
    );
    return tx.paymentCycle.findUniqueOrThrow({ where: { id } });
  });
}

export async function rejectPayment(id: string, userId: string, input: RejectPaymentInput) {
  const current = await getOwnedPayment(id, userId);
  if (current.status === 'CONFIRMED') throw new AppError('payment/already-confirmed');
  if (current.status !== 'MARKED_PAID') throw new AppError('payment/invalid-transition');

  const { group } = current.membership;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.paymentCycle.updateMany({
      where: { id, status: 'MARKED_PAID' },
      data: { status: 'PENDING', rejectionReason: input.reason, markedPaidAt: null },
    });
    if (updated.count === 0) throw new AppError('payment/invalid-transition');

    await notify(
      tx,
      current.membership.userId,
      'PAYMENT_REJECTED',
      'Pago rechazado',
      `El administrador de "${group.title}" rechazó tu pago: ${input.reason}`,
      { groupId: group.id, paymentId: id },
    );
    return tx.paymentCycle.findUniqueOrThrow({ where: { id } });
  });
}
