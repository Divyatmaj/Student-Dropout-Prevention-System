/**
 * Local development server: `npm run dev:api` (from the repo root).
 * On Vercel the app runs as a function instead (see /api/index.js).
 */
import app from './app.js';
import { env } from './config/env.js';
import { disconnectPrisma, isDatabaseConfigured } from './config/prisma.js';

const server = app.listen(env.PORT, () => {
  console.log(`Udaan API listening on http://localhost:${env.PORT}/api/v1`);
  if (!isDatabaseConfigured()) {
    console.warn('DATABASE_URL is not set — data routes will return 503. Copy server/.env.example to server/.env.');
  }
});

async function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
