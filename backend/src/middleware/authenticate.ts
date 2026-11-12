import type { RequestHandler } from 'express';

import { AppError } from '../lib/errors';
import { verifyAccessToken } from '../services/auth';

declare module 'express-serve-static-core' {
  interface Request {
    auth?: { userId: string; email: string };
  }
}

export const authenticate: RequestHandler = (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) return next(new AppError('auth/token-invalid'));
  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, email: payload.email };
    next();
  } catch (err) {
    next(err);
  }
};
