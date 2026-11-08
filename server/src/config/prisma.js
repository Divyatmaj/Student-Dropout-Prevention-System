/**
 * One Prisma Client per process, created on first use.
 *
 * Prisma 7 connects through a driver adapter; here the node-postgres
 * adapter with a small pool. On Vercel each function instance keeps its own
 * pool, so point DATABASE_URL at Neon's pooled (PgBouncer) endpoint.
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { env } from './env.js';
import { AppError } from '../utils/AppError.js';

const globalForPrisma = globalThis;

export function isDatabaseConfigured() {
  return Boolean(env.DATABASE_URL);
}

/** The shared client. Throws a 503 AppError when DATABASE_URL is not set. */
export function getPrisma() {
  if (!env.DATABASE_URL) {
    throw new AppError({
      status: 503,
      code: 'DATABASE_NOT_CONFIGURED',
      message: 'The database is not configured. Set DATABASE_URL for the Udaan API.',
    });
  }
  if (!globalForPrisma.__udaanPrisma) {
    const adapter = new PrismaPg({
      connectionString: env.DATABASE_URL,
      max: env.DB_POOL_MAX,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    });
    globalForPrisma.__udaanPrisma = new PrismaClient({
      adapter,
      log: env.isProduction || env.isTest ? ['error'] : ['warn', 'error'],
    });
  }
  return globalForPrisma.__udaanPrisma;
}

/** Close the pool (used on shutdown and after tests). */
export async function disconnectPrisma() {
  if (globalForPrisma.__udaanPrisma) {
    await globalForPrisma.__udaanPrisma.$disconnect();
    globalForPrisma.__udaanPrisma = undefined;
  }
}
