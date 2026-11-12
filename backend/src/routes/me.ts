import { Router } from 'express';

import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/authenticate';
import { validateBody } from '../middleware/validate';
import { updateProfileSchema } from '../schemas/auth';
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

  return router;
}
