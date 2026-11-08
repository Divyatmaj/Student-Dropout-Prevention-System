import { z } from 'zod';
import { GRADES, SECTIONS, SUBJECTS, MAX_ASSESSMENT_MARKS } from '@udaan/shared';

import { optionalQueryString, optionalQueryEnum } from './common.js';
import { isoDate } from './attendance.validator.js';

const maxMarks = z.coerce
  .number({ error: `Maximum marks must be between 1 and ${MAX_ASSESSMENT_MARKS}.` })
  .positive(`Maximum marks must be between 1 and ${MAX_ASSESSMENT_MARKS}.`)
  .max(MAX_ASSESSMENT_MARKS, `Maximum marks must be between 1 and ${MAX_ASSESSMENT_MARKS}.`);

const fields = {
  title: z.string({ error: 'Enter a title.' }).trim().min(2, 'Enter a title.').max(100, 'Keep the title under 100 characters.'),
  subject: z.enum(SUBJECTS, { error: 'Choose a subject.' }),
  grade: z.enum(GRADES, { error: 'Choose a grade.' }),
  section: z.preprocess((v) => (v === '' || v === undefined ? null : v), z.enum(SECTIONS, { error: 'Choose a valid section.' }).nullable()),
  assessmentDate: isoDate('assessment date'),
  maxMarks,
};

export const createAssessmentSchema = z.object(fields);

export const updateAssessmentSchema = z
  .object(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.optional()])))
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update.' });

export const listAssessmentsQuery = z.object({
  search: optionalQueryString,
  grade: optionalQueryEnum(GRADES),
  section: optionalQueryEnum(SECTIONS),
  subject: optionalQueryEnum(SUBJECTS),
});

// Scores are range-checked against the assessment's maximum in the service.
const score = z.union([z.number(), z.string().trim().min(1)], { error: 'Enter a score.' });

export const bulkMarksSchema = z.object({
  assessmentId: z.uuid('Not a valid assessment.'),
  entries: z
    .array(z.object({ studentId: z.uuid('Not a valid student.'), score }))
    .min(1, 'Enter at least one score.')
    .max(200, 'Save at most 200 scores at once.'),
});

export const recordMarkSchema = z.object({
  studentId: z.uuid('Choose a student.'),
  assessmentId: z.uuid('Choose an assessment.'),
  score,
});

export const updateMarkSchema = z.object({ score });

export const deleteMarkSchema = z.object({
  reason: z.string({ error: 'Give a short reason (at least 5 characters).' }).trim().min(5, 'Give a short reason (at least 5 characters).').max(500),
});
