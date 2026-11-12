import { daysUntil } from '../lib/dates';
import { prisma } from '../lib/prisma';
import { notifyOnce } from '../services/notifications';

const REMINDER_DAYS_BEFORE = 2;

const cop = (n: number) => `$${n.toLocaleString('es-CO')}`;

/**
 * Recordatorios (2 días antes o el día del vencimiento) y aviso de atraso.
 * Idempotente por el `@@unique([userId, type, paymentId])`. Devuelve cuántas notificaciones nuevas envió.
 */
export async function sendReminders(now = new Date()) {
  const active = { status: 'ACTIVE' as const, group: { status: { in: ['OPEN', 'FULL'] as ('OPEN' | 'FULL')[] } } };
  const include = { membership: { include: { group: { select: { id: true, title: true } } } } };
  let sent = 0;

  const upcoming = await prisma.paymentCycle.findMany({
    where: {
      status: 'PENDING',
      dueDate: { gte: new Date(now.getTime() - 86_400_000), lte: new Date(now.getTime() + 3 * 86_400_000) },
      membership: active,
    },
    include,
  });
  for (const p of upcoming) {
    const days = daysUntil(p.dueDate, now);
    if (days !== REMINDER_DAYS_BEFORE && days !== 0) continue;
    const { group, userId } = p.membership;
    const when = days === 0 ? 'vence hoy' : `vence en ${days} días`;
    const ok = await notifyOnce(
      userId,
      'PAYMENT_REMINDER',
      p.id,
      'Recordatorio de pago',
      `Tu cuota de "${group.title}" (${cop(p.amount)}) ${when}`,
      { groupId: group.id, paymentId: p.id },
    );
    if (ok) sent++;
  }

  const overdue = await prisma.paymentCycle.findMany({ where: { status: 'OVERDUE', membership: active }, include });
  for (const p of overdue) {
    const { group, userId } = p.membership;
    const ok = await notifyOnce(
      userId,
      'PAYMENT_OVERDUE',
      p.id,
      'Cuota atrasada',
      `Tu cuota de "${group.title}" (${cop(p.amount)}) está atrasada`,
      { groupId: group.id, paymentId: p.id },
    );
    if (ok) sent++;
  }
  return sent;
}
