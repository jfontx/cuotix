import { z } from 'zod';

const groupFields = {
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().max(500),
  pricePerMember: z.number().int().min(1).max(10_000_000),
  paymentDay: z.number().int().min(1).max(28),
  slots: z.number().int().min(1).max(20),
  payoutMethod: z.string().trim().min(2).max(40),
  payoutDetail: z.string().trim().min(3).max(200),
};

export const createGroupSchema = z.object({
  serviceId: z.uuid(),
  ...groupFields,
  description: groupFields.description.optional(),
});

export const updateGroupSchema = z
  .object({ ...groupFields, status: z.enum(['OPEN', 'PAUSED']) })
  .partial()
  .refine((v) => Object.keys(v).length > 0);

const queryBool = z.enum(['true', 'false']).transform((v) => v === 'true');

export const listGroupsQuerySchema = z
  .object({
    serviceId: z.uuid(),
    status: z.enum(['OPEN', 'FULL', 'PAUSED', 'CLOSED']),
    minPrice: z.coerce.number().int().min(0),
    maxPrice: z.coerce.number().int().min(0),
    search: z.string().trim().min(1).max(80),
    excludeMine: queryBool,
    mine: queryBool,
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .partial({ serviceId: true, status: true, minPrice: true, maxPrice: true, search: true, excludeMine: true, mine: true });

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type ListGroupsQuery = z.infer<typeof listGroupsQuerySchema>;
