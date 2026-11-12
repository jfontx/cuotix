import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

import { AppError } from '../lib/errors';

export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const fields = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      return next(new AppError('validation/error', fields));
    }
    req.body = result.data;
    next();
  };
}
