import { Router } from 'express';
import { z } from 'zod';

import { AppError } from '../lib/errors';
import { authenticate } from '../middleware/authenticate';
import { getService, listServices } from '../services/services-catalog';

export function createServicesRouter() {
  const router = Router();
  router.use(authenticate);

  router.get('/', async (_req, res) => {
    res.json({ data: await listServices() });
  });

  router.get('/:id', async (req, res) => {
    // Un id que no es UUID no puede existir: 404 en vez de error de BD
    if (!z.uuid().safeParse(req.params.id).success) throw new AppError('general/not-found');
    res.json({ service: await getService(req.params.id) });
  });

  return router;
}
