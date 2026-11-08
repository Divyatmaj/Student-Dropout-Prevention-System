/**
 * Environment configuration, validated once at startup.
 *
 * Locally, values come from server/.env. On Vercel they come from the
 * project's environment variables. A missing DATABASE_URL does not crash
 * the API: health checks still answer and data routes return 503
 * DATABASE_NOT_CONFIGURED, which is easier to diagnose on a serverless host.
 */
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  DATABASE_URL: optionalString.refine((v) => !v || /^postgres(ql)?:\/\//.test(v), {
    message: 'must be a postgresql:// connection string',
  }),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(50).default(5),
  CORS_ORIGINS: optionalString.transform((v) =>
    v ? v.split(',').map((o) => o.trim()).filter(Boolean) : []
  ),
  VERCEL: optionalString,
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid Udaan API environment configuration:\n${problems}`);
}

export const env = Object.freeze({
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
  isServerless: Boolean(parsed.data.VERCEL),
});
