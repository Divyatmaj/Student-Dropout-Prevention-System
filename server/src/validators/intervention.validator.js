/**
 * Request shapes for interventions. Business rules (required fields,
 * follow-up after due date, status transitions) are applied by the shared
 * validators in the service, the same ones the web app uses.
 */
import { z } from 'zod';
import { CONCERN_CATEGORIES, INTERVENTION_PRIORITIES, INTERVENTION_STATUSES } from '@udaan/shared';

import { optionalQueryString, optionalQueryEnum } from './common.js';
import { isValidIsoDate } from '../utils/dates.js';

const text = (max) => z.preprocess((v) => (typeof v === 'string' ? v.trim() : v), z.string().max(max, `Keep this under ${max} characters.`));
const nullableText = (max) =>
  z.preprocess((v) => (typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v ?? null), z.string().max(max, `Keep this under ${max} characters.`).nullable());
const date = z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  z.string().refine(isValidIsoDate, 'Use a valid date (YYYY-MM-DD).').nullable()
);
const optionalQueryDate = z.preprocess(
  (v) => (v === '' || v === undefined ? undefined : v),
  z.string().refine(isValidIsoDate, 'Use a valid date (YYYY-MM-DD).').optional()
);

export const createInterventionSchema = z.object({
  studentId: z.uuid('Choose a student.'),
  category: z.enum(CONCERN_CATEGORIES, { error: 'Choose a concern category.' }),
  priority: z.enum(INTERVENTION_PRIORITIES, { error: 'Choose a priority.' }).default('MEDIUM'),
  description: text(2000),
  actionPlan: nullableText(2000).optional(),
  assignedToId: z.uuid('Choose who owns this intervention.'),
  dueDate: date,
  followUpDate: date.optional(),
});

export const updateInterventionSchema = z
  .object({
    category: z.enum(CONCERN_CATEGORIES, { error: 'Choose a concern category.' }).optional(),
    priority: z.enum(INTERVENTION_PRIORITIES, { error: 'Choose a priority.' }).optional(),
    description: text(2000).optional(),
    actionPlan: nullableText(2000).optional(),
    assignedToId: z.uuid('Choose an active staff member.').optional(),
    dueDate: date.optional(),
    followUpDate: date.optional(),
    note: text(1000).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update.' });

export const statusSchema = z.object({
  status: z.enum(INTERVENTION_STATUSES, { error: 'Choose a valid status.' }),
  outcome: text(2000).optional(),
  note: text(1000).optional(),
});

export const listInterventionsQuery = z.object({
  status: optionalQueryEnum(['active', ...INTERVENTION_STATUSES]),
  priority: optionalQueryEnum(INTERVENTION_PRIORITIES),
  category: optionalQueryEnum(CONCERN_CATEGORIES),
  assignedTo: z.preprocess((v) => (v === '' ? undefined : v), z.union([z.literal('me'), z.uuid()]).optional()),
  due: optionalQueryEnum(['overdue', 'week']),
  dueFrom: optionalQueryDate,
  dueTo: optionalQueryDate,
  studentId: z.preprocess((v) => (v === '' ? undefined : v), z.uuid().optional()),
  search: optionalQueryString,
}).refine((query) => !query.dueFrom || !query.dueTo || query.dueFrom <= query.dueTo, {
  message: 'Due-from date must be on or before due-to date.',
  path: ['dueFrom'],
});
