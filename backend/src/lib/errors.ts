export const ERROR_CODES = {
  'auth/invalid-credentials': { status: 401, message: 'Correo o contraseña incorrectos' },
  'auth/token-expired': { status: 401, message: 'Tu sesión expiró, inicia sesión nuevamente' },
  'auth/token-invalid': { status: 401, message: 'Sesión inválida' },
  'auth/token-revoked': { status: 401, message: 'Sesión revocada por seguridad' },
  'auth/email-exists': { status: 409, message: 'Este correo ya está registrado' },
  'validation/error': { status: 400, message: 'Datos inválidos' },
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
