import { z } from 'zod';
import {
  GRADES,
  SECTIONS,
  STUDENT_STATUSES,
  GUARDIAN_RELATIONSHIPS,
  STUDENT_CODE_PATTERN,
  GUARDIAN_PHONE_PATTERN,
} from '@udaan/shared';

import { nullableText, optionalQueryString, optionalQueryEnum, pageQuery } from './common.js';
import { isValidIsoDate, schoolToday } from '../utils/dates.js';

const optionalDate = (check, message) =>
  z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z
      .string()
      .refine(isValidIsoDate, 'Use a valid date (YYYY-MM-DD).')
      .refine(check, message)
      .nullable()
  );

const fields = {
  studentCode: z
    .string({ error: 'Student code is required.' })
    .trim()
    .toUpperCase()
    .regex(STUDENT_CODE_PATTERN, 'Use 3–20 letters, numbers or hyphens, e.g. UDN-0101.'),
  fullName: z
    .string({ error: 'Full name is required.' })
    .trim()
    .transform((v) => v.replace(/\s+/g, ' '))
    .pipe(z.string().min(2, 'Name must be between 2 and 100 characters.').max(100, 'Name must be between 2 and 100 characters.')),
  dateOfBirth: optionalDate((d) => d < schoolToday(), 'Date of birth must be in the past.'),
  grade: z.enum(GRADES, { error: 'Select a valid grade.' }),
  section: z.preprocess((v) => (v === '' || v === undefined ? null : v), z.enum(SECTIONS, { error: 'Select a valid section.' }).nullable()),
  admissionDate: optionalDate((d) => d <= schoolToday(), 'Admission date cannot be in the future.'),
  guardianName: nullableText(100, 'Guardian name must be 100 characters or fewer.'),
  guardianPhone: z.preprocess(
    (v) => (typeof v === 'string' ? v.replace(/[\s-]/g, '') || null : v ?? null),
    z.string().regex(GUARDIAN_PHONE_PATTERN, 'Enter a 10–13 digit phone number.').nullable()
  ),
  guardianRelationship: z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z.enum(GUARDIAN_RELATIONSHIPS, { error: 'Select a relationship from the list.' }).nullable()
  ),
  financialBarrierReported: z.boolean({ error: 'Must be true or false.' }),
  supportNotes: nullableText(1000, 'Support notes must be 1000 characters or fewer.'),
  assignedTeacherId: z.preprocess((v) => (v === '' || v === undefined ? null : v), z.uuid('Choose a teacher from the list.').nullable()),
};

export const createStudentSchema = z.object({
  ...fields,
  financialBarrierReported: fields.financialBarrierReported.default(false),
  dateOfBirth: fields.dateOfBirth.optional(),
  section: fields.section.optional(),
  admissionDate: fields.admissionDate.optional(),
  guardianName: fields.guardianName.optional(),
  guardianPhone: fields.guardianPhone.optional(),
  guardianRelationship: fields.guardianRelationship.optional(),
  supportNotes: fields.supportNotes.optional(),
  assignedTeacherId: fields.assignedTeacherId.optional(),
});

export const updateStudentSchema = z
  .object(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.optional()])))
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update.' });

export const studentStatusSchema = z.object({
  status: z.enum(STUDENT_STATUSES, { error: 'Invalid student status.' }),
});

export const listStudentsQuery = z.object({
  search: optionalQueryString,
  grade: optionalQueryEnum(GRADES),
  section: optionalQueryEnum(SECTIONS),
  status: optionalQueryEnum(STUDENT_STATUSES),
  riskCategory: optionalQueryEnum(['LOW', 'MEDIUM', 'HIGH', 'INSUFFICIENT_DATA']),
  ...pageQuery(20, 500),
});
