import { Router } from 'express';

import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/authenticate';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  listNotificationsQuerySchema,
  pushTokenSchema,
  type ListNotificationsQuery,
} from '../schemas/notifications';
import { updateProfileSchema } from '../schemas/auth';
import { listPaymentsQuerySchema, type ListPaymentsQuery } from '../schemas/payments';
import { listMyPayments } from '../services/payments';
import { listNotifications, markAllNotificationsRead, registerPushToken } from '../services/notifications';
import { toPublicUser } from '../services/users';

export function createMeRouter() {
  const router = Router();
  router.use(authenticate);

  router.get('/', async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
    if (!user) throw new AppError('auth/token-invalid');
    res.json({ user: toPublicUser(user) });
  });

  router.patch('/', validateBody(updateProfileSchema), async (req, res) => {
    const user = await prisma.user
      .update({ where: { id: req.auth!.userId }, data: req.body })
      .catch((err) => {
        if (err?.code === 'P2025') throw new AppError('auth/token-invalid');
        throw err;
      });
    res.json({ user: toPublicUser(user) });
  });

  router.get('/payments', validateQuery(listPaymentsQuerySchema), async (req, res) => {
    res.json({ data: await listMyPayments(req.auth!.userId, res.locals.query as ListPaymentsQuery) });
  });

  router.post('/push-token', validateBody(pushTokenSchema), async (req, res) => {
    await registerPushToken(req.auth!.userId, req.body.token, req.body.platform);
    res.status(204).end();
  });

  router.get('/notifications', validateQuery(listNotificationsQuerySchema), async (req, res) => {
    const { page, limit } = res.locals.query as ListNotificationsQuery;
    res.json(await listNotifications(req.auth!.userId, page, limit));
  });

  router.post('/notifications/read-all', async (req, res) => {
    res.json(await markAllNotificationsRead(req.auth!.userId));
  });

  return router;
}
