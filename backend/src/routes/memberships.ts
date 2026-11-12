import { Router } from 'express';
import { z } from 'zod';

import { AppError } from '../lib/errors';
import { authenticate } from '../middleware/authenticate';
import { validateBody } from '../middleware/validate';
import { approveSchema, removeSchema } from '../schemas/memberships';
import {
  approveMembership,
  confirmAccess,
  leaveMembership,
  rejectMembership,
  removeMember,
} from '../services/memberships';

function membershipId(param: string | string[] | undefined) {
  if (typeof param !== 'string' || !z.uuid().safeParse(param).success) throw new AppError('membership/not-found');
  return param;
}

export function createMembershipsRouter() {
  const router = Router();
  router.use(authenticate);

  router.patch('/:id/approve', validateBody(approveSchema), async (req, res) => {
    res.json({ membership: await approveMembership(membershipId(req.params.id), req.auth!.userId, req.body) });
  });

  router.patch('/:id/reject', async (req, res) => {
    res.json({ membership: await rejectMembership(membershipId(req.params.id), req.auth!.userId) });
  });

  router.post('/:id/confirm-access', async (req, res) => {
    res.json({ membership: await confirmAccess(membershipId(req.params.id), req.auth!.userId) });
  });

  router.post('/:id/leave', async (req, res) => {
    res.json({ membership: await leaveMembership(membershipId(req.params.id), req.auth!.userId) });
  });

  router.post('/:id/remove', validateBody(removeSchema), async (req, res) => {
    res.json({ membership: await removeMember(membershipId(req.params.id), req.auth!.userId, req.body) });
  });

  return router;
}
