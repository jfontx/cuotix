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
