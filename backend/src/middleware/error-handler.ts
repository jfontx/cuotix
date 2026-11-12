import type { ErrorRequestHandler, RequestHandler } from 'express';

import { AppError } from '../lib/errors';

export const notFoundHandler: RequestHandler = (_req, _res, next) => next(new AppError('general/not-found'));

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let appError: AppError;
  if (err instanceof AppError) {
    appError = err;
  } else if (err?.type === 'entity.parse.failed') {
    appError = new AppError('validation/error');
  } else {
    console.error(err);
    appError = new AppError('general/internal-error');
  }
  res.status(appError.status).json({
    error: { code: appError.code, message: appError.message, ...(appError.details ? { details: appError.details } : {}) },
  });
};
