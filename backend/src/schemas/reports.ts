import { z } from 'zod';

export const createReportSchema = z.object({
  groupId: z.uuid(),
  reportedId: z.uuid(),
  reason: z.string().trim().min(3).max(100),
  detail: z.string().trim().min(1).max(500).optional(),
});

export const listReportsQuerySchema = z
  .object({ status: z.enum(['OPEN', 'REVIEWED', 'DISMISSED']) })
  .partial();

export const updateReportSchema = z.object({
  status: z.enum(['OPEN', 'REVIEWED', 'DISMISSED']),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
