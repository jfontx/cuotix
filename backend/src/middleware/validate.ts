import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

import { AppError } from '../lib/errors';

function validationError(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const fields = error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
  return new AppError('validation/error', fields);
}

export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) return next(validationError(result.error));
    req.body = result.data;
    next();
  };
}

/** Valida `req.query`; el resultado queda en `res.locals.query` (en Express 5 `req.query` es de solo lectura). */
export function validateQuery<T>(schema: ZodType<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) return next(validationError(result.error));
    res.locals.query = result.data;
    next();
  };
}
