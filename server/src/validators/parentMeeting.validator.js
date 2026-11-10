import { z } from 'zod';
import { isValidIsoDate } from '../utils/dates.js';

const isoDate = z.string().refine(isValidIsoDate, 'Choose a valid date (YYYY-MM-DD).');
const optionalText = (max) => z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : typeof value === 'string' ? value.trim() : value ?? null),
  z.string().max(max, `Keep this under ${max} characters.`).nullable()
);

export const createParentMeetingSchema = z.object({
  meetingDate: isoDate,
  attendees: z.string().trim().min(2, 'Enter who attended the meeting.').max(500, 'Keep attendees under 500 characters.'),
  notes: z.string().trim().min(5, 'Add a short summary of the discussion.').max(4000, 'Keep meeting notes under 4,000 characters.'),
  followUpActions: optionalText(4000).optional(),
  followUpDate: z.preprocess(
    (value) => (value === '' || value === undefined ? null : value),
    isoDate.nullable()
  ).optional(),
}).refine((values) => !values.followUpDate || values.followUpDate >= values.meetingDate, {
  message: 'Follow-up date must be on or after the meeting date.',
  path: ['followUpDate'],
});
