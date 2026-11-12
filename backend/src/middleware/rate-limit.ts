import type { Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

import { AppError } from '../lib/errors';

interface Options {
  limit: number;
  windowMs: number;
  /** Agrega el correo del body a la clave (login) */
  byEmail?: boolean;
  /** Los tests de rate limit lo fuerzan; por defecto se desactiva en NODE_ENV=test */
  force?: boolean;
}

export function createRateLimiter({ limit, windowMs, byEmail, force }: Options) {
  return rateLimit({
    limit,
    windowMs,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test' && !force,
    keyGenerator: (req: Request) => {
      const ip = ipKeyGenerator(req.ip ?? '');
      const email = byEmail && typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      return email ? `${ip}|${email}` : ip;
    },
    handler: (_req, _res, next) => next(new AppError('rate-limit/exceeded')),
  });
}
