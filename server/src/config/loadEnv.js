/**
 * Load local env files for the API and the Prisma CLI.
 *
 * Checked in this order (the first file to define a variable wins, and real
 * environment variables — e.g. on Vercel — always win over files):
 *   1. server/.env        — your own overrides for the API
 *   2. <repo>/.env.local  — written by `neon deploy` / `neon env pull`
 *   3. <repo>/.env
 * All three are git-ignored.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const repoDir = path.resolve(serverDir, '..');

export const ENV_FILES = [
  path.join(serverDir, '.env'),
  path.join(repoDir, '.env.local'),
  path.join(repoDir, '.env'),
];

export function loadEnvFiles() {
  dotenv.config({ path: ENV_FILES, quiet: true });
}
