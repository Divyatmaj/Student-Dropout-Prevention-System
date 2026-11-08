/**
 * Student-related enums and option lists shared by the Udaan web app.
 * Values match the Udaan API / database enums exactly.
 */

export const STUDENT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  TRANSFERRED: 'TRANSFERRED',
  COMPLETED: 'COMPLETED',
};

export const STUDENT_STATUS_LABELS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  TRANSFERRED: 'Transferred',
  COMPLETED: 'Completed',
};

export const STUDENT_STATUS_HELP = {
  ACTIVE: 'Currently enrolled. Included in attendance, risk and dashboard figures.',
  INACTIVE: 'Not currently attending. Records are kept but excluded from active lists.',
  TRANSFERRED: 'Moved to another school. Records are kept for reference.',
  COMPLETED: 'Finished schooling here. Records are kept for reference.',
};

export const RISK_CATEGORY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
};

export const RISK_CATEGORY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  INSUFFICIENT_DATA: 'Insufficient data',
};

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

export const STUDENTS_PAGE_SIZE = 20;
