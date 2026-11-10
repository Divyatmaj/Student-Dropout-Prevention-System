/**
 * Role-based permissions, shared by the Udaan web app and API.
 *
 * The web app uses them to decide what to show; the API enforces the same
 * table on every request (plus school scoping and record ownership in its
 * services). Hiding a button is never the security boundary.
 */

export const ROLES = {
  SCHOOL_ADMIN: 'SCHOOL_ADMIN',
  PRINCIPAL: 'PRINCIPAL',
  TEACHER: 'TEACHER',
};

export const ROLE_LABELS = {
  SCHOOL_ADMIN: 'School Administrator',
  PRINCIPAL: 'Principal',
  TEACHER: 'Teacher',
};

const { SCHOOL_ADMIN, PRINCIPAL, TEACHER } = ROLES;
const ALL_STAFF = [SCHOOL_ADMIN, PRINCIPAL, TEACHER];

/** Permission name → roles allowed to use it. */
const PERMISSION_ROLES = {
  // Viewing (teachers see only their assigned students — enforced by the API)
  DASHBOARD_VIEW: ALL_STAFF,
  DASHBOARD_SCHOOL_VIEW: [SCHOOL_ADMIN, PRINCIPAL], // whole-school figures
  DASHBOARD_TEACHER_VIEW: [TEACHER], // assigned-student figures
  STUDENTS_VIEW: ALL_STAFF,
  ATTENDANCE_VIEW: ALL_STAFF,
  ACADEMICS_VIEW: ALL_STAFF,
  RISK_VIEW: ALL_STAFF,
  INTERVENTIONS_VIEW: ALL_STAFF,
  PARENT_MEETINGS_VIEW: ALL_STAFF,
  PARENT_MEETINGS_CREATE: ALL_STAFF,

  // Students
  STUDENT_CREATE: [SCHOOL_ADMIN, PRINCIPAL],
  STUDENT_UPDATE: ALL_STAFF, // teachers: guardian contact & support notes only
  STUDENT_EDIT_ENROLMENT: [SCHOOL_ADMIN, PRINCIPAL], // code, grade, section, dates
  STUDENT_CHANGE_STATUS: [SCHOOL_ADMIN],

  // Attendance & academics
  ATTENDANCE_RECORD: ALL_STAFF,
  ATTENDANCE_CORRECT_ANY: [SCHOOL_ADMIN, PRINCIPAL], // others may correct only their own entries
  ATTENDANCE_DELETE: [SCHOOL_ADMIN],
  ASSESSMENT_CREATE: ALL_STAFF,
  ASSESSMENT_UPDATE_ANY: [SCHOOL_ADMIN], // others may edit only assessments they created
  ASSESSMENT_DELETE: [SCHOOL_ADMIN], // only while no marks are recorded
  MARKS_RECORD: ALL_STAFF,
  MARKS_DELETE: [SCHOOL_ADMIN],

  // Risk
  RISK_RECALCULATE: ALL_STAFF,
  RISK_REVIEW: ALL_STAFF,
  RISK_RECALCULATE_ALL: [SCHOOL_ADMIN, PRINCIPAL],

  // Interventions
  INTERVENTION_CREATE: ALL_STAFF,
  INTERVENTION_UPDATE: ALL_STAFF, // creator or owner — see canManageIntervention
  INTERVENTION_MANAGE_ANY: [SCHOOL_ADMIN, PRINCIPAL],

  // Staff management
  STAFF_VIEW: [SCHOOL_ADMIN, PRINCIPAL],
  STAFF_MANAGE: [SCHOOL_ADMIN],
};

export const PERMISSIONS = Object.fromEntries(
  Object.keys(PERMISSION_ROLES).map((key) => [key, key])
);

/** Can this user perform the given permission? */
export function can(user, permission) {
  if (!user || !user.isActive) return false;
  const allowed = PERMISSION_ROLES[permission];
  return Boolean(allowed && allowed.includes(user.role));
}

/** Can this user correct a specific attendance record? */
export function canCorrectAttendance(user, record) {
  if (!record) return can(user, 'ATTENDANCE_RECORD');
  return (
    can(user, 'ATTENDANCE_CORRECT_ANY') ||
    (can(user, 'ATTENDANCE_RECORD') && record.recordedById === user?.id)
  );
}

/** Can this user edit or change the status of a specific intervention? */
export function canManageIntervention(user, intervention) {
  if (!intervention) return false;
  return (
    can(user, 'INTERVENTION_MANAGE_ANY') ||
    (can(user, 'INTERVENTION_UPDATE') &&
      (intervention.createdById === user?.id || intervention.assignedToId === user?.id))
  );
}
