import { z } from 'zod';

export const markPaidSchema = z.object({
  reference: z.string().trim().min(1).max(100).optional(),
});

export const rejectPaymentSchema = z.object({
  reason: z.string().trim().min(10).max(200),
});

export const listPaymentsQuerySchema = z
  .object({ status: z.enum(['PENDING', 'MARKED_PAID', 'CONFIRMED', 'OVERDUE', 'CANCELLED']) })
  .partial();

export type MarkPaidInput = z.infer<typeof markPaidSchema>;
export type RejectPaymentInput = z.infer<typeof rejectPaymentSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
