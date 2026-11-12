import { z } from 'zod';

export const approveSchema = z.object({
  firstAmount: z.number().int().min(1).max(10_000_000).optional(),
});

export const removeSchema = z.object({
  reason: z.string().trim().min(1).max(200).optional(),
});

export type ApproveInput = z.infer<typeof approveSchema>;
export type RemoveInput = z.infer<typeof removeSchema>;
