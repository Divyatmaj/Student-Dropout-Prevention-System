/**
 * Environment configuration, validated once at startup.
 *
 * Locally, values come from the env files listed in loadEnv.js (Neon writes
 * DATABASE_URL into the repo's .env.local). On Vercel they come from the
 * project's environment variables. A missing DATABASE_URL does not crash
 * the API: health checks still answer and data routes return 503
 * DATABASE_NOT_CONFIGURED, which is easier to diagnose on a serverless host.
 */
import { z } from 'zod';

import { loadEnvFiles } from './loadEnv.js';

loadEnvFiles();

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

/**
 * Forgive the usual copy-paste slips when a value is pasted into a hosting
 * dashboard: surrounding quotes, or the whole `NAME=value` line.
 */
export function cleanSecretValue(name, value) {
  if (typeof value !== 'string') return value;
  let v = value.trim();
  if (v.startsWith(`${name}=`)) v = v.slice(name.length + 1).trim();
  const quoted = /^(["'])(.*)\1$/s.exec(v);
  if (quoted) v = quoted[2].trim();
  return v;
}

/** How a bad value begins, up to the first ":" — never far enough to include a password. */
export function describeStart(value) {
  if (!value) return 'empty';
  const prefix = value.split(':')[0].slice(0, 15);
  return `starts with "${prefix}${value.length > prefix.length ? '…' : ''}"`;
}

const databaseUrl = optionalString.superRefine((v, ctx) => {
  if (v && !/^postgres(ql)?:\/\//.test(v)) {
    ctx.addIssue({
      code: 'custom',
      message: `must be a postgresql:// connection string (the value ${describeStart(v)}). Paste only the URL — no quotes, no "DATABASE_URL=", no "psql".`,
    });
  }
});

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  DATABASE_URL: databaseUrl,
  DB_POOL_MAX: z.coerce.number().int().min(1).max(50).default(5),
  // Signs login tokens. Use a long random value (e.g. `openssl rand -base64 48`).
  JWT_SECRET: optionalString.refine((v) => !v || v.length >= 32, {
    message: 'must be at least 32 characters (generate one with `openssl rand -base64 48`)',
  }),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, 'use a duration like 8h or 30m')
    .default('8h'),
  // The school's timezone decides what "today" is (attendance dates, overdue checks).
  SCHOOL_TIMEZONE: z
    .string()
    .default('Asia/Kolkata')
    .refine((tz) => {
      try {
        new Intl.DateTimeFormat('en-CA', { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, 'must be an IANA timezone such as Asia/Kolkata'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  // Failed sign-in attempts allowed per IP and email in 15 minutes.
  LOGIN_RATE_LIMIT: z.coerce.number().int().min(1).max(1000).default(10),
  CORS_ORIGINS: optionalString.transform((v) =>
    v ? v.split(',').map((o) => o.trim()).filter(Boolean) : []
  ),
  VERCEL: optionalString,
});

const input = { ...process.env };
for (const name of ['DATABASE_URL', 'JWT_SECRET']) input[name] = cleanSecretValue(name, input[name]);

const parsed = schema.safeParse(input);

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
