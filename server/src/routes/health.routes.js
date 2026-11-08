import { Router } from 'express';

import { getPrisma, isDatabaseConfigured } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

const router = Router();

/**
 * GET /api/v1/health — is the API process up? (no database call)
 */
router.get('/', (req, res) => {
  sendSuccess(res, {
    status: 'ok',
    service: 'udaan-api',
    environment: env.NODE_ENV,
    databaseConfigured: isDatabaseConfigured(),
    time: new Date().toISOString(),
  });
});

/**
 * GET /api/v1/health/db — can the API reach the database?
 * 200 { database: 'ok', latencyMs } or 503 DATABASE_UNAVAILABLE / DATABASE_NOT_CONFIGURED.
 */
router.get('/db', async (req, res) => {
  const prisma = getPrisma();
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    if (!env.isTest) console.error('[udaan-api] database health check failed:', err.message);
    throw new AppError({ status: 503, code: 'DATABASE_UNAVAILABLE', message: 'The API cannot reach the database.' });
  }
  sendSuccess(res, { database: 'ok', latencyMs: Date.now() - start });
});

export default router;
