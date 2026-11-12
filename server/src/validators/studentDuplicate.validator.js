import { z } from 'zod';

export const studentDuplicateCheckSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  guardianName: z.string().trim().max(100).nullable().optional(),
  guardianPhone: z.string().trim().max(30).nullable().optional(),
});
