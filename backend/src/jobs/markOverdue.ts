import { prisma } from '../lib/prisma';

export const GRACE_DAYS = 3;

/** Pasa a `OVERDUE` las cuotas `PENDING` vencidas hace más de `GRACE_DAYS` días. Devuelve cuántas marcó. */
export async function markOverdue(now = new Date()) {
  const cutoff = new Date(now.getTime() - GRACE_DAYS * 86_400_000);

  const { count } = await prisma.paymentCycle.updateMany({
    where: {
      status: 'PENDING',
      dueDate: { lt: cutoff },
      membership: { status: 'ACTIVE', group: { status: { in: ['OPEN', 'FULL'] } } },
    },
    data: { status: 'OVERDUE', overdueAt: now },
  });
  return count;
}
