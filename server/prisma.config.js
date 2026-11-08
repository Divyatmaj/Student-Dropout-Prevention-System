/**
 * Prisma 7 CLI configuration (migrate, generate, studio).
 *
 * The CLI connects with DIRECT_URL when it is set. On Neon, use the direct
 * (non-pooled) connection string there, because migrations need a session
 * that PgBouncer's transaction pooling does not provide. The running API
 * uses DATABASE_URL (the pooled string) through the pg driver adapter; see
 * src/config/prisma.js.
 */
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

dotenv.config({ quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
