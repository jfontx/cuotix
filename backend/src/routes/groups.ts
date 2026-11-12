import { Router } from 'express';
import { z } from 'zod';

import { AppError } from '../lib/errors';
import { authenticate } from '../middleware/authenticate';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createGroupSchema,
  listGroupsQuerySchema,
  updateGroupSchema,
  type ListGroupsQuery,
} from '../schemas/groups';
import { joinGroup, listMembers } from '../services/memberships';
import { closeGroup, createGroup, getGroupDetail, listGroups, updateGroup } from '../services/groups';

/** Un id que no es UUID no puede existir: 404 en vez de error de BD */
function groupId(param: string | string[] | undefined) {
  if (typeof param !== 'string' || !z.uuid().safeParse(param).success) throw new AppError('general/not-found');
  return param;
}

export function createGroupsRouter() {
  const router = Router();
  router.use(authenticate);

  router.post('/', validateBody(createGroupSchema), async (req, res) => {
    res.status(201).json({ group: await createGroup(req.auth!.userId, req.body) });
  });

  router.get('/', validateQuery(listGroupsQuerySchema), async (req, res) => {
    res.json(await listGroups(req.auth!.userId, res.locals.query as ListGroupsQuery));
  });

  router.get('/:id', async (req, res) => {
    res.json({ group: await getGroupDetail(groupId(req.params.id), req.auth!.userId) });
  });

  router.patch('/:id', validateBody(updateGroupSchema), async (req, res) => {
    res.json({ group: await updateGroup(groupId(req.params.id), req.auth!.userId, req.body) });
  });

  router.post('/:id/close', async (req, res) => {
    res.json({ group: await closeGroup(groupId(req.params.id), req.auth!.userId) });
  });

  router.post('/:id/join', async (req, res) => {
    res.status(201).json({ membership: await joinGroup(groupId(req.params.id), req.auth!.userId) });
  });

  router.get('/:id/members', async (req, res) => {
    res.json({ data: await listMembers(groupId(req.params.id), req.auth!.userId) });
  });

  return router;
}
