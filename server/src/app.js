/**
 * The Udaan API as an Express app.
 *
 * Used in two places:
 *   - src/server.js listens on PORT for local development;
 *   - /api/index.js exports it as the Vercel serverless function, so the
 *     web app and API share one domain in production.
 *
 * Middleware order: security headers and CORS → JSON body parser →
 * development request log → routes → 404 → error handler.
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import v1Routes from './routes/index.js';

export const API_PREFIX = '/api/v1';
export const JSON_BODY_LIMIT = '100kb';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // Behind Vercel's proxy: trust the first hop for req.ip (used by rate limiting).
  app.set('trust proxy', 1);

  app.use(helmet());
  // Same-origin in production (Vercel), so CORS is only enabled when origins are listed.
  if (env.CORS_ORIGINS.length) {
    app.use(cors({ origin: env.CORS_ORIGINS, credentials: false }));
  }

  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  if (!env.isProduction && !env.isTest) app.use(requestLogger);

  // API responses contain student data — never cache them in shared caches.
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  app.use(API_PREFIX, v1Routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

const app = createApp();
export default app;
