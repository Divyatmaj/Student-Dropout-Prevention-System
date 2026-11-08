import { z } from 'zod';

import { optionalQueryString } from './common.js';
import { MIN_PASSWORD_LENGTH } from '../utils/passwords.js';

/** Roles a school admin can give (platform admins are not created here). */
export const STAFF_ROLES = ['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'];

const name = z.string().trim().min(2, 'Enter the full name.').max(100);
const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address.')).pipe(z.string().max(150));
const role = z.enum(STAFF_ROLES, { error: 'Choose a role.' });

export const listUsersQuery = z.object({
  search: optionalQueryString,
  role: z.enum(STAFF_ROLES).optional().or(z.literal('').transform(() => undefined)),
  status: z.enum(['active', 'inactive']).optional().or(z.literal('').transform(() => undefined)),
});

export const createUserSchema = z.object({
  name,
  email,
  role,
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`)
    .max(200, 'Use at most 200 characters.'),
});

export const updateUserSchema = z
  .object({ name: name.optional(), email: email.optional(), role: role.optional() })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update.' });

export const userStatusSchema = z.object({
  isActive: z.boolean({ error: 'isActive must be true or false.' }),
});
