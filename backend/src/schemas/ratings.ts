import { z } from 'zod';

export const createRatingSchema = z.object({
  groupId: z.uuid(),
  toId: z.uuid(),
  score: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(300).optional(),
});

export const listRatingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;
export type ListRatingsQuery = z.infer<typeof listRatingsQuerySchema>;
