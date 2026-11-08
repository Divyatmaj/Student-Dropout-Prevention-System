import { defineConfig } from 'vitest/config';

// Tests never use the local env files' database (DATABASE_URL is set here, so
// the files cannot override it). Database tests run only when
// TEST_DATABASE_URL points at a disposable database.
export default defineConfig({
  test: {
    environment: 'node',
    // Database tests share one test database, so run files one at a time.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? '',
      DATABASE_URL_UNPOOLED: '',
      CORS_ORIGINS: '',
      JWT_SECRET: 'test-only-secret-that-is-long-enough-1234567890',
      JWT_EXPIRES_IN: '1h',
      BCRYPT_ROUNDS: '4',
      LOGIN_RATE_LIMIT: '1000',
    },
  },
});
