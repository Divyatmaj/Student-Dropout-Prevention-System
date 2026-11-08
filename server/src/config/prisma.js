/**
 * One Prisma Client per process, created on first use.
 *
 * Prisma 7 connects through a driver adapter. Following Neon's guidance for
 * Vercel, this uses node-postgres (`pg`) with a small pool over Neon's pooled
 * (-pooler) DATABASE_URL, and registers the pool with Vercel's
 * attachDatabasePool so idle connections are released before a Fluid compute
 * instance is suspended. Outside Vercel that call does nothing.
 */
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { attachDatabasePool } from '@vercel/functions';

import { env } from './env.js';
import { AppError } from '../utils/AppError.js';

const globalForPrisma = globalThis;

/**
 * Neon connection strings use `sslmode=require`. node-postgres currently
 * treats that as full certificate verification but will switch to weaker
 * libpq semantics in pg v9, so pin today's behaviour explicitly. Strings that
 * opt into libpq semantics (`uselibpqcompat=true`) are left alone.
 */
export function withVerifiedSsl(connectionString) {
  let url;
  try {
    url = new URL(connectionString);
  } catch {
    return connectionString;
  }
  const mode = url.searchParams.get('sslmode');
  if (url.searchParams.get('uselibpqcompat') !== 'true' && ['prefer', 'require', 'verify-ca'].includes(mode)) {
    url.searchParams.set('sslmode', 'verify-full');
  }
  return url.toString();
}

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
    const pool = new pg.Pool({
      connectionString: withVerifiedSsl(env.DATABASE_URL),
      max: env.DB_POOL_MAX,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    });
    // An idle client that loses its connection must not crash the process.
    pool.on('error', (err) => console.error('[udaan-api] idle database connection error:', err.message));
    attachDatabasePool(pool);

    const adapter = new PrismaPg(pool);
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
