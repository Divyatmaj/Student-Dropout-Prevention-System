import { defineConfig } from 'vitest/config';

// Tests never use the local env files' database (DATABASE_URL is set here, so
// the files cannot override it). Database tests run only when
// TEST_DATABASE_URL points at a disposable database.
export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? '',
      DATABASE_URL_UNPOOLED: '',
      CORS_ORIGINS: '',
    },
  },
});
