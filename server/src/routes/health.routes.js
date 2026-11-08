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
 * GET /api/v1/health/db — can the API reach the database, and is it migrated?
 * 200 { database: 'ok', latencyMs, latestMigration } or
 * 503 DATABASE_UNAVAILABLE / DATABASE_NOT_CONFIGURED.
 * `latestMigration` is null when `npm run db:deploy` has not been run yet.
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
  const latencyMs = Date.now() - start;

  let latestMigration = null;
  try {
    const rows = await prisma.$queryRaw`
      SELECT migration_name FROM _prisma_migrations
      WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
      ORDER BY finished_at DESC LIMIT 1`;
    latestMigration = rows[0]?.migration_name ?? null;
  } catch {
    // _prisma_migrations does not exist yet: connected, but not migrated.
  }
  sendSuccess(res, { database: 'ok', latencyMs, latestMigration });
});

export default router;
