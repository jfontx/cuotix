/** Pesos colombianos con separador de miles (sin depender de Intl, ausente en algunos motores). */
export function formatCop(amount: number): string {
  return `$${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export function slotsLabel(available: number): string {
  if (available <= 0) return 'Sin cupos disponibles';
  return available === 1 ? '1 cupo disponible' : `${available} cupos disponibles`;
}
