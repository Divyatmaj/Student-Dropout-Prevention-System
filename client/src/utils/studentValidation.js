/**
 * Client-side validation for the student form.
 *
 * This gives fast feedback in the browser. The Udaan API validates the same
 * rules again (and checks that the student code is unique in the school).
 */
import { GUARDIAN_PHONE_PATTERN, STUDENT_CODE_PATTERN } from '@udaan/shared';

import { GRADES, SECTIONS, GUARDIAN_RELATIONSHIPS } from '../constants/students.js';
import { todayISO } from './formatters.js';

export const EMPTY_STUDENT_FORM = {
  studentCode: '',
  fullName: '',
  dateOfBirth: '',
  grade: '',
  section: '',
  admissionDate: '',
  guardianName: '',
  guardianPhone: '',
  guardianRelationship: '',
  financialBarrierReported: false,
  supportNotes: '',
  assignedTeacherId: '',
};

const DATE_FIELDS = ['dateOfBirth', 'admissionDate'];

/** Turn an API student into form values (nulls → empty strings). */
export function studentToFormValues(student) {
  if (!student) return { ...EMPTY_STUDENT_FORM };
  return Object.fromEntries(
    Object.entries(EMPTY_STUDENT_FORM).map(([key, empty]) => {
      const value = student[key];
      if (typeof empty === 'boolean') return [key, Boolean(value)];
      if (value === null || value === undefined) return [key, ''];
      // API dates may be full ISO timestamps; <input type="date"> needs YYYY-MM-DD.
      return [key, DATE_FIELDS.includes(key) ? String(value).slice(0, 10) : String(value)];
    })
  );
}

/** Trim strings, upper-case the code and send empty optional fields as null. */
export function toStudentPayload(values) {
  const clean = (value) => {
    const trimmed = (value ?? '').toString().trim();
    return trimmed === '' ? null : trimmed;
  };

  return {
    studentCode: clean(values.studentCode)?.toUpperCase() ?? null,
    fullName: clean(values.fullName)?.replace(/\s+/g, ' ') ?? null,
    dateOfBirth: clean(values.dateOfBirth),
    grade: clean(values.grade),
    section: clean(values.section),
    admissionDate: clean(values.admissionDate),
    guardianName: clean(values.guardianName),
    guardianPhone: clean(values.guardianPhone)?.replace(/[\s-]/g, '') ?? null,
    guardianRelationship: clean(values.guardianRelationship),
    financialBarrierReported: Boolean(values.financialBarrierReported),
    supportNotes: clean(values.supportNotes),
    assignedTeacherId: clean(values.assignedTeacherId),
  };
}

/** @returns {Record<string, string>} field → error message (empty when valid) */
export function validateStudentForm(values) {
  const errors = {};
  const payload = toStudentPayload(values);
  const today = todayISO();

  if (!payload.studentCode) {
    errors.studentCode = 'Student code is required.';
  } else if (!STUDENT_CODE_PATTERN.test(payload.studentCode)) {
    errors.studentCode = 'Use 3–20 letters, numbers or hyphens, e.g. UDN-0101.';
  }

  if (!payload.fullName) {
    errors.fullName = 'Full name is required.';
  } else if (payload.fullName.length < 2 || payload.fullName.length > 100) {
    errors.fullName = 'Name must be between 2 and 100 characters.';
  }

  if (!payload.grade) {
    errors.grade = 'Select a grade.';
  } else if (!GRADES.includes(payload.grade)) {
    errors.grade = 'Select a valid grade.';
  }

  if (payload.section && !SECTIONS.includes(payload.section)) {
    errors.section = 'Select a valid section.';
  }

  if (payload.dateOfBirth && payload.dateOfBirth >= today) {
    errors.dateOfBirth = 'Date of birth must be in the past.';
  }

  if (payload.admissionDate && payload.admissionDate > today) {
    errors.admissionDate = 'Admission date cannot be in the future.';
  }

  if (payload.guardianPhone && !GUARDIAN_PHONE_PATTERN.test(payload.guardianPhone)) {
    errors.guardianPhone = 'Enter a 10–13 digit phone number.';
  }

  if (payload.guardianRelationship && !GUARDIAN_RELATIONSHIPS.includes(payload.guardianRelationship)) {
    errors.guardianRelationship = 'Select a relationship from the list.';
  }

  if (payload.guardianName && payload.guardianName.length > 100) {
    errors.guardianName = 'Guardian name must be 100 characters or fewer.';
  }

  if (payload.supportNotes && payload.supportNotes.length > 1000) {
    errors.supportNotes = 'Support notes must be 1000 characters or fewer.';
  }

  return errors;
}

/** Map API validation details `[{ field, message }]` onto form field errors. */
export function apiDetailsToFieldErrors(details = []) {
  return details.reduce((acc, item) => {
    if (item?.field && item?.message) acc[item.field] = item.message;
    return acc;
  }, {});
}
