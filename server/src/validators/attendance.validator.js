import { z } from 'zod';
import { ATTENDANCE_STATUSES, GRADES, SECTIONS } from '@udaan/shared';

import { nullableText, optionalQueryString, optionalQueryEnum, pageQuery } from './common.js';
import { isValidIsoDate } from '../utils/dates.js';

export const isoDate = (field = 'date') =>
  z.string({ error: 'A valid date is required.' }).refine(isValidIsoDate, `A valid ${field} is required (YYYY-MM-DD).`);

const optionalIsoDate = z.preprocess((v) => (v === '' ? undefined : v), isoDate().optional());

const status = z.enum(ATTENDANCE_STATUSES, { error: 'Choose Present, Absent, Late or Excused.' });
const note = nullableText(500, 'Keep the note under 500 characters.');

export const recordAttendanceSchema = z.object({
  studentId: z.uuid('Choose a student.'),
  date: isoDate(),
  status,
  note: note.optional(),
});

export const bulkAttendanceSchema = z.object({
  date: isoDate(),
  entries: z
    .array(z.object({ studentId: z.uuid('Not a valid student.'), status, note: note.optional() }))
    .min(1, 'Mark at least one student.')
    .max(200, 'Save at most 200 students at once.'),
});

export const updateAttendanceSchema = z
  .object({ status: status.optional(), note: note.optional() })
  .refine((v) => v.status !== undefined || v.note !== undefined, { message: 'Nothing to update.' });

export const deleteAttendanceSchema = z.object({
  reason: z.string({ error: 'Give a short reason (at least 5 characters).' }).trim().min(5, 'Give a short reason (at least 5 characters).').max(500),
});

export const overviewQuery = z.object({ from: optionalIsoDate, to: optionalIsoDate });

export const listAttendanceQuery = z.object({
  date: optionalIsoDate,
  from: optionalIsoDate,
  to: optionalIsoDate,
  grade: optionalQueryEnum(GRADES),
  section: optionalQueryEnum(SECTIONS),
  status: optionalQueryEnum(ATTENDANCE_STATUSES),
  search: optionalQueryString,
  ...pageQuery(50, 500),
});

export const registerQuery = z.object({
  date: isoDate(),
  grade: z.enum(GRADES, { error: 'Choose a grade.' }),
  section: optionalQueryEnum(SECTIONS),
});

export const studentAttendanceQuery = z.object({ from: optionalIsoDate, to: optionalIsoDate });
export const studentIdParam = z.object({ studentId: z.uuid('Not a valid id.') });
