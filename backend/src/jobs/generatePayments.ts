import { currentPeriod, dueDateFor, shiftPeriod } from '../lib/dates';
import { prisma } from '../lib/prisma';

/** Crea la cuota del mes siguiente para cada membresía activa. Idempotente. Devuelve cuántas creó. */
export async function generatePaymentCycles(now = new Date()) {
  const period = shiftPeriod(currentPeriod(now), 1);

  const memberships = await prisma.membership.findMany({
    where: {
      status: 'ACTIVE',
      group: { status: { in: ['OPEN', 'FULL'] } },
      cycles: { none: { period } },
    },
    include: { group: { select: { pricePerMember: true, paymentDay: true } } },
  });
  if (memberships.length === 0) return 0;

  const { count } = await prisma.paymentCycle.createMany({
    data: memberships.map((m) => ({
      membershipId: m.id,
      period,
      amount: m.group.pricePerMember,
      dueDate: dueDateFor(period, m.group.paymentDay),
      status: 'PENDING' as const,
    })),
    skipDuplicates: true,
  });
  return count;
}
