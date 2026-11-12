import { Router } from 'express';
import { z } from 'zod';

import { AppError } from '../lib/errors';
import { authenticate } from '../middleware/authenticate';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  createReportSchema,
  listReportsQuerySchema,
  updateReportSchema,
  type ListReportsQuery,
} from '../schemas/reports';
import { createReport, getReports, updateReport } from '../services/reports';

export function createReportsRouter() {
  const router = Router();
  router.use(authenticate);

  router.post('/', validateBody(createReportSchema), async (req, res) => {
    res.status(201).json({ report: await createReport(req.auth!.userId, req.body) });
  });

  router.get('/', validateQuery(listReportsQuerySchema), async (req, res) => {
    res.json({ data: await getReports(req.auth!.userId, res.locals.query as ListReportsQuery) });
  });

  router.patch('/:id', validateBody(updateReportSchema), async (req, res) => {
    const id = req.params.id;
    if (typeof id !== 'string' || !z.uuid().safeParse(id).success) throw new AppError('general/not-found');
    res.json({ report: await updateReport(req.auth!.userId, id, req.body) });
  });

  return router;
}
