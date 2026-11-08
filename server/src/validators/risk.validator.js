import { z } from 'zod';
import { GRADES, SECTIONS, RISK_CATEGORIES, DATA_STATUSES } from '@udaan/shared';

import { optionalQueryString, optionalQueryEnum } from './common.js';

export const listRiskQuery = z.object({
  category: optionalQueryEnum(RISK_CATEGORIES),
  dataStatus: optionalQueryEnum(DATA_STATUSES),
  grade: optionalQueryEnum(GRADES),
  section: optionalQueryEnum(SECTIONS),
  review: optionalQueryEnum(['needs', 'reviewed']),
  search: optionalQueryString,
});

export const studentIdParam = z.object({ studentId: z.uuid('Not a valid id.') });

export const reviewSchema = z.object({
  note: z
    .string({ error: 'Add a short review note (at least 10 characters).' })
    .trim()
    .min(10, 'Add a short review note (at least 10 characters).')
    .max(1000, 'Keep the note under 1000 characters.'),
});
