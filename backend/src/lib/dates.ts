/** Bogotá es UTC-5 todo el año (sin horario de verano). */
const BOGOTA_OFFSET_HOURS = 5;

/** Fecha y hora "de pared" en Bogotá para un instante dado. */
function bogotaParts(date: Date) {
  const shifted = new Date(date.getTime() - BOGOTA_OFFSET_HOURS * 3_600_000);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}

export function formatPeriod(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Suma `delta` meses a un período `YYYY-MM`. */
export function shiftPeriod(period: string, delta: number) {
  const [y, m] = period.split('-').map(Number);
  const index = y * 12 + (m - 1) + delta;
  return formatPeriod(Math.floor(index / 12), (index % 12) + 1);
}

/** `dueDate` = `paymentDay` del mes de `period` a las 00:00 de Bogotá (A.6). */
export function dueDateFor(period: string, paymentDay: number) {
  const [y, m] = period.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, paymentDay, BOGOTA_OFFSET_HOURS));
}

/** Período de la primera cuota: el mes actual si el día de pago aún no pasó, si no el siguiente. */
export function firstPeriod(now: Date, paymentDay: number) {
  const { year, month, day } = bogotaParts(now);
  const current = formatPeriod(year, month);
  return day <= paymentDay ? current : shiftPeriod(current, 1);
}

/** Próximo día de pago estrictamente posterior a `now`: fin del ciclo vigente. */
export function nextCycleEnd(now: Date, paymentDay: number) {
  const { year, month } = bogotaParts(now);
  const thisMonth = dueDateFor(formatPeriod(year, month), paymentDay);
  return thisMonth > now ? thisMonth : dueDateFor(shiftPeriod(formatPeriod(year, month), 1), paymentDay);
}

/** Período `YYYY-MM` vigente en Bogotá. */
export function currentPeriod(now: Date) {
  const { year, month } = bogotaParts(now);
  return formatPeriod(year, month);
}

/** Inicio (00:00 de Bogotá) del día de `now`. */
export function bogotaDayStart(now: Date) {
  const { year, month, day } = bogotaParts(now);
  return new Date(Date.UTC(year, month - 1, day, BOGOTA_OFFSET_HOURS));
}

/** Días calendario (Bogotá) que faltan para `date`; negativo si ya pasó. */
export function daysUntil(date: Date, now: Date) {
  return Math.round((bogotaDayStart(date).getTime() - bogotaDayStart(now).getTime()) / 86_400_000);
}
