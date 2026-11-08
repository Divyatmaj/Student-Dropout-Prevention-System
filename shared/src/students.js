/**
 * Student enums and formats shared by the Udaan web app and API.
 * Values match the database enums exactly.
 */
export const STUDENT_STATUSES = ['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'COMPLETED'];

/** Grades offered by the demo school (primary to secondary). */
export const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export const SECTIONS = ['A', 'B', 'C', 'D'];

export const GUARDIAN_RELATIONSHIPS = [
  'Mother',
  'Father',
  'Grandparent',
  'Sibling',
  'Aunt/Uncle',
  'Legal guardian',
  'Other',
];

/** 3–20 upper-case letters, digits or hyphens, e.g. UDN-0101. */
export const STUDENT_CODE_PATTERN = /^[A-Z0-9][A-Z0-9-]{2,19}$/;

/** 10–13 digits, optional leading +, after removing spaces and hyphens. */
export const GUARDIAN_PHONE_PATTERN = /^\+?\d{10,13}$/;

/** Fields only school admins and principals may change (teachers: contact & support only). */
export const STUDENT_ENROLMENT_FIELDS = [
  'studentCode',
  'fullName',
  'dateOfBirth',
  'grade',
  'section',
  'admissionDate',
  'assignedTeacherId',
];
