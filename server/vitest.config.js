import { defineConfig } from 'vitest/config';

// Tests never use server/.env. Database tests run only when
// TEST_DATABASE_URL points at a disposable database.
export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? '',
      DIRECT_URL: '',
      CORS_ORIGINS: '',
    },
  },
});
