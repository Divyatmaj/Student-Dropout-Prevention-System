/**
 * Date-only values ("YYYY-MM-DD").
 *
 * Postgres DATE columns come back from Prisma as JS Dates at UTC midnight,
 * so conversions always go through UTC. "Today" is the school's local date
 * (SCHOOL_TIMEZONE), not the server's — Vercel runs in UTC.
 */
import { env } from '../config/env.js';

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** "2026-11-06" → Date at 2026-11-06T00:00:00Z (for Prisma DATE columns). */
export function toDbDate(isoDate) {
  return isoDate ? new Date(`${isoDate}T00:00:00.000Z`) : null;
}

/** Date from a DATE column → "2026-11-06"; null stays null. */
export function fromDbDate(value) {
  return value ? value.toISOString().slice(0, 10) : null;
}

/** Today's date at the school, as YYYY-MM-DD. */
export function schoolToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: env.SCHOOL_TIMEZONE }).format(now);
}

export function addDays(isoDate, days) {
  const d = toDbDate(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return fromDbDate(d);
}

/** Is this a real calendar date (rejects 2026-02-30)? */
export function isValidIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  return fromDbDate(toDbDate(value)) === value;
}
