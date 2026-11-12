import { Router } from 'express';
import { z } from 'zod';

import { AppError } from '../lib/errors';
import { authenticate } from '../middleware/authenticate';
import { validateQuery } from '../middleware/validate';
import { listRatingsQuerySchema, type ListRatingsQuery } from '../schemas/ratings';
import { getUserRatings } from '../services/ratings';

export function createUsersRouter() {
  const router = Router();
  router.use(authenticate);

  router.get('/:id/ratings', validateQuery(listRatingsQuerySchema), async (req, res) => {
    const id = req.params.id;
    if (typeof id !== 'string' || !z.uuid().safeParse(id).success) throw new AppError('general/not-found');
    const { page, limit } = res.locals.query as ListRatingsQuery;
    res.json(await getUserRatings(id, page, limit));
  });

  return router;
}
