import { Router } from 'express';
import { z } from 'zod';

import { AppError } from '../lib/errors';
import { authenticate } from '../middleware/authenticate';
import { markNotificationRead } from '../services/notifications';

export function createNotificationsRouter() {
  const router = Router();
  router.use(authenticate);

  router.patch('/:id/read', async (req, res) => {
    const id = req.params.id;
    if (typeof id !== 'string' || !z.uuid().safeParse(id).success) throw new AppError('general/not-found');
    res.json({ notification: await markNotificationRead(id, req.auth!.userId) });
  });

  return router;
}
