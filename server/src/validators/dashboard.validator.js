import { z } from 'zod';

export const dashboardQuery = z.object({
  days: z.preprocess((v) => (v === '' || v === undefined ? 30 : v), z.coerce.number().int().min(1).max(365)),
});
