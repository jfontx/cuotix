import type { PaymentStatus } from '@/theme';
import type { PaymentCycleStatus } from '@/store/paymentsApi';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Estado del servidor → clave del `StatusBadge` */
export const BADGE_STATUS: Record<PaymentCycleStatus, PaymentStatus> = {
  PENDING: 'pending',
  MARKED_PAID: 'markedPaid',
  CONFIRMED: 'confirmed',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
};

/** `2026-11` → `noviembre` */
export function monthName(period: string): string {
  return MONTHS[Number(period.split('-')[1]) - 1] ?? period;
}

/** `2026-11` → `Cuota noviembre` */
export function periodTitle(period: string): string {
  const name = monthName(period);
  return `Cuota ${name}`;
}

/** Fecha de vencimiento en horario de Bogotá (UTC-5 fijo): `15 de noviembre de 2026`. */
export function formatDueDate(iso: string): string {
  const d = new Date(new Date(iso).getTime() - 5 * 3_600_000);
  return `${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

/** Cuotas que el miembro aún debe pagar (o que fueron rechazadas) */
export const isPayable = (status: PaymentCycleStatus) => status === 'PENDING' || status === 'OVERDUE';
