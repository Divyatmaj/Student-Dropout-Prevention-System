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

export { GRADES, SECTIONS, GUARDIAN_RELATIONSHIPS } from '@udaan/shared';

export const STUDENTS_PAGE_SIZE = 20;
