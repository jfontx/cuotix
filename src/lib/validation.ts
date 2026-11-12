import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email('Ingresa un correo válido'));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Ingresa tu nombre (mínimo 2 caracteres)').max(80),
  email,
  phone: z
    .string()
    .trim()
    .refine((v) => v === '' || (v.length >= 7 && v.length <= 20), 'Teléfono inválido')
    .optional(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
});

/** Convierte los errores de Zod en `{ campo: mensaje }` (primer mensaje por campo). */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    out[key] ??= issue.message;
  }
  return out;
}

const wholeNumber = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label}: ingresa solo números`)
    .transform(Number)
    .pipe(z.number().min(min, `${label}: mínimo ${min}`).max(max, `${label}: máximo ${max}`));

/** Formulario de crear grupo: los campos numéricos llegan como texto. */
export const createGroupSchema = z.object({
  serviceId: z.string().min(1, 'Elige un servicio'),
  title: z.string().trim().min(3, 'El título debe tener al menos 3 caracteres').max(80, 'Máximo 80 caracteres'),
  description: z.string().trim().max(500, 'Máximo 500 caracteres').optional(),
  pricePerMember: wholeNumber('Precio', 1, 10_000_000),
  paymentDay: wholeNumber('Día de pago', 1, 28),
  slots: wholeNumber('Cupos', 1, 20),
  payoutMethod: z.string().trim().min(2, 'Indica el medio de pago (ej: Nequi)').max(40, 'Máximo 40 caracteres'),
  payoutDetail: z.string().trim().min(3, 'Indica el número o cuenta para recibir pagos').max(200, 'Máximo 200 caracteres'),
});
