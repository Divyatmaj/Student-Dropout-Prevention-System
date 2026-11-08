/**
 * Prisma 7 CLI configuration (migrate, generate, studio).
 *
 * Migrations use DATABASE_URL_UNPOOLED, Neon's direct (non-pooled)
 * connection: Prisma Migrate needs session features that PgBouncer's
 * transaction pooling does not provide. Without it (e.g. a local Postgres)
 * the CLI falls back to DATABASE_URL. The running API always uses the pooled
 * DATABASE_URL — see src/config/prisma.js.
 */
import { defineConfig } from 'prisma/config';

import { loadEnvFiles } from './src/config/loadEnv.js';

loadEnvFiles();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
  },
});
