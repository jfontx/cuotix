import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email());

export const registerSchema = z.object({
  email,
  password: z.string().min(8).max(128),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20).optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1),
  pushToken: z.string().min(1).optional(),
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(7).max(20).nullable(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0);
