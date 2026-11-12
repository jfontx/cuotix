import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { createAuthRouter } from './routes/auth';
import { createMeRouter } from './routes/me';

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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
