import { Router } from 'express';

import { authenticate } from '../middleware/authenticate';
import { validateBody } from '../middleware/validate';
import { createRatingSchema } from '../schemas/ratings';
import { createRating } from '../services/ratings';

export function createRatingsRouter() {
  const router = Router();
  router.use(authenticate);

  router.post('/', validateBody(createRatingSchema), async (req, res) => {
    res.status(201).json({ rating: await createRating(req.auth!.userId, req.body) });
  });

  return router;
}
