/**
 * Intervention enums and labels. Values match the Udaan API / database enums.
 */
export const INTERVENTION_STATUS_LABELS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const INTERVENTION_PRIORITY_LABELS = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export const CONCERN_CATEGORY_LABELS = {
  ATTENDANCE: 'Attendance',
  ACADEMIC: 'Academic',
  FINANCIAL: 'Financial',
  ACCESSIBILITY: 'Accessibility',
  FAMILY: 'Family',
  OTHER: 'Other',
};

export const CONCERN_CATEGORY_HELP = {
  ATTENDANCE: 'Absences, lateness or long gaps',
  ACADEMIC: 'Falling results or difficulty with subjects',
  FINANCIAL: 'Fees, transport, uniform or books',
  ACCESSIBILITY: 'Health, disability or access needs',
  FAMILY: 'Family circumstances or responsibilities at home',
  OTHER: 'Anything else',
};

/** Labels for history entries. */
export const HISTORY_LABELS = {
  CREATED: 'Created',
  STATUS_CHANGED: 'Status changed',
  UPDATED: 'Plan updated',
  REASSIGNED: 'Reassigned',
  NOTE: 'Note added',
};
