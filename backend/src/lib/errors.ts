export const ERROR_CODES = {
  'auth/invalid-credentials': { status: 401, message: 'Correo o contraseña incorrectos' },
  'auth/token-expired': { status: 401, message: 'Tu sesión expiró, inicia sesión nuevamente' },
  'auth/token-invalid': { status: 401, message: 'Sesión inválida' },
  'auth/token-revoked': { status: 401, message: 'Sesión revocada por seguridad' },
  'auth/email-exists': { status: 409, message: 'Este correo ya está registrado' },
  'validation/error': { status: 400, message: 'Datos inválidos' },
  'group/full': { status: 409, message: 'Este grupo no tiene cupos disponibles' },
  'group/closed': { status: 409, message: 'Este grupo está cerrado' },
  'group/already-member': { status: 409, message: 'Ya eres miembro de este grupo' },
  'group/not-owner': { status: 403, message: 'Solo el administrador puede hacer esto' },
  'group/slots-exceeded': { status: 409, message: 'No hay cupos disponibles' },
  'group/has-pending-payments': { status: 409, message: 'Hay pagos pendientes de confirmar' },
  'membership/not-found': { status: 404, message: 'Membresía no encontrada' },
  'membership/invalid-transition': { status: 409, message: 'Esta acción no es válida en el estado actual' },
  'membership/not-eligible-removal': { status: 409, message: 'Este miembro no puede ser expulsado aún' },
  'payment/not-found': { status: 404, message: 'Pago no encontrado' },
  'payment/already-confirmed': { status: 409, message: 'Este pago ya fue confirmado' },
  'payment/invalid-transition': { status: 409, message: 'Esta acción no es válida en el estado actual' },
  'rating/already-rated': { status: 409, message: 'Ya calificaste a este usuario en este grupo' },
  'rating/not-eligible': { status: 403, message: 'No puedes calificar aún' },
  'rate-limit/exceeded': { status: 429, message: 'Demasiados intentos, espera unos minutos' },
  'general/not-found': { status: 404, message: 'No encontrado' },
  'general/forbidden': { status: 403, message: 'No tienes permiso para esto' },
  'general/internal-error': { status: 500, message: 'Error interno, intenta más tarde' },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export class AppError extends Error {
  readonly status: number;

  constructor(
    readonly code: ErrorCode,
    readonly details?: unknown,
  ) {
    super(ERROR_CODES[code].message);
    this.status = ERROR_CODES[code].status;
  }
}
