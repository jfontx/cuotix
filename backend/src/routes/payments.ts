import { Router } from 'express';
import { z } from 'zod';

import { AppError } from '../lib/errors';
import { authenticate } from '../middleware/authenticate';
import { validateBody } from '../middleware/validate';
import { markPaidSchema, rejectPaymentSchema } from '../schemas/payments';
import { confirmPayment, getPaymentDetail, markAsPaid, rejectPayment } from '../services/payments';

function paymentId(param: string | string[] | undefined) {
  if (typeof param !== 'string' || !z.uuid().safeParse(param).success) throw new AppError('payment/not-found');
  return param;
}

export function createPaymentsRouter() {
  const router = Router();
  router.use(authenticate);

  router.get('/:id', async (req, res) => {
    res.json({ payment: await getPaymentDetail(paymentId(req.params.id), req.auth!.userId) });
  });

  router.post('/:id/mark-paid', validateBody(markPaidSchema), async (req, res) => {
    res.json({ payment: await markAsPaid(paymentId(req.params.id), req.auth!.userId, req.body) });
  });

  router.post('/:id/confirm', async (req, res) => {
    res.json({ payment: await confirmPayment(paymentId(req.params.id), req.auth!.userId) });
  });

  router.post('/:id/reject', validateBody(rejectPaymentSchema), async (req, res) => {
    res.json({ payment: await rejectPayment(paymentId(req.params.id), req.auth!.userId, req.body) });
  });

  return router;
}
