import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { createAuthRouter } from './routes/auth';
import { createGroupsRouter } from './routes/groups';
import { createMembershipsRouter } from './routes/memberships';
import { createMeRouter } from './routes/me';
import { createNotificationsRouter } from './routes/notifications';
import { createPaymentsRouter } from './routes/payments';
import { createRatingsRouter } from './routes/ratings';
import { createReportsRouter } from './routes/reports';
import { createServicesRouter } from './routes/services';
import { createUsersRouter } from './routes/users';

export function createApp(opts: { forceRateLimit?: boolean } = {}) {
  const app = express();

  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/auth', createAuthRouter(opts));
  app.use('/me', createMeRouter());
  app.use('/services', createServicesRouter());
  app.use('/groups', createGroupsRouter());
  app.use('/memberships', createMembershipsRouter());
  app.use('/notifications', createNotificationsRouter());
  app.use('/payments', createPaymentsRouter());
  app.use('/ratings', createRatingsRouter());
  app.use('/reports', createReportsRouter());
  app.use('/users', createUsersRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
