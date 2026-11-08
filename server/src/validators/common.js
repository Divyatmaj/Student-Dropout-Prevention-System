import { z } from 'zod';

export const idParam = z.object({ id: z.uuid('Not a valid id.') });

/** Trimmed string; empty becomes undefined (for optional query filters). */
export const optionalQueryString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

/** Empty string / null / undefined → null, otherwise the trimmed string. */
export const nullableText = (max, message) =>
  z.preprocess(
    (v) => (typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v ?? null),
    z.string().max(max, message).nullable()
  );

/** Optional query enum; empty string means "no filter". */
export const optionalQueryEnum = (values) =>
  z.preprocess((v) => (v === '' ? undefined : v), z.enum(values).optional());

export const pageQuery = (defaultLimit = 20, maxLimit = 100) => ({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(maxLimit).default(defaultLimit),
});
