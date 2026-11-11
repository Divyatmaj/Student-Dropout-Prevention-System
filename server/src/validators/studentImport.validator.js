import { z } from 'zod';

export const studentImportRowsSchema = z.object({
  rows: z.array(z.unknown()).min(1, 'Add at least one student row.').max(50, 'Import at most 50 students per batch.'),
});
