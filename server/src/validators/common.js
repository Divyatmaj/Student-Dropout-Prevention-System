import { z } from 'zod';

export const idParam = z.object({ id: z.uuid('Not a valid id.') });

/** Trimmed string; empty becomes undefined (for optional query filters). */
export const optionalQueryString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));
