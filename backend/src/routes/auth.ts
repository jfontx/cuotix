import { Router } from 'express';

import { rateLimitConfig } from '../lib/config';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/authenticate';
import { createRateLimiter } from '../middleware/rate-limit';
import { validateBody } from '../middleware/validate';
import { loginSchema, logoutSchema, refreshSchema, registerSchema } from '../schemas/auth';
import { hashPassword, issueTokens, revokeRefreshToken, rotateRefreshToken, verifyPassword } from '../services/auth';
import { toPublicUser } from '../services/users';

// Hash válido precalculado para igualar el tiempo de respuesta cuando el correo no existe
let dummyHash: Promise<string> | undefined;

export function createAuthRouter(opts: { forceRateLimit?: boolean } = {}) {
  const router = Router();
  const cfg = rateLimitConfig();
  const force = opts.forceRateLimit;

  router.post(
    '/register',
    createRateLimiter({ ...cfg.register, force }),
    validateBody(registerSchema),
    async (req, res) => {
      const { email, password, name, phone } = req.body;
      if (await prisma.user.findUnique({ where: { email } })) throw new AppError('auth/email-exists');

      const user = await prisma.user
        .create({ data: { email, name, phone, passwordHash: await hashPassword(password) } })
        .catch((err) => {
          if (err?.code === 'P2002' || err?.cause?.code === '23505') throw new AppError('auth/email-exists');
          throw err;
        });
      res.status(201).json({ user: toPublicUser(user), ...(await issueTokens(user)) });
    },
  );

  router.post(
    '/login',
    validateBody(loginSchema),
    createRateLimiter({ ...cfg.login, byEmail: true, force }),
    async (req, res) => {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      dummyHash ??= hashPassword('dummy-password');
      const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
      if (!user || !ok) throw new AppError('auth/invalid-credentials');
      res.json({ user: toPublicUser(user), ...(await issueTokens(user)) });
    },
  );

  router.post('/refresh', createRateLimiter({ ...cfg.refresh, force }), validateBody(refreshSchema), async (req, res) => {
    res.json(await rotateRefreshToken(req.body.refreshToken));
  });

  router.post('/logout', authenticate, validateBody(logoutSchema), async (req, res) => {
    const { userId } = req.auth!;
    await revokeRefreshToken(userId, req.body.refreshToken);
    if (req.body.pushToken) await prisma.pushToken.deleteMany({ where: { userId, token: req.body.pushToken } });
    res.status(204).end();
  });

  return router;
}
