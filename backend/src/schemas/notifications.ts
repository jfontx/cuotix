import { z } from 'zod';

export const pushTokenSchema = z.object({
  token: z.string().trim().min(1).max(200),
  platform: z.enum(['ios', 'android', 'web']),
});

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type PushTokenInput = z.infer<typeof pushTokenSchema>;
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
