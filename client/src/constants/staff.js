/** Staff roles a school admin can assign (matches the Udaan API UserRole enum). */
export const STAFF_ROLES = ['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'];

export const STAFF_ROLE_HELP = {
  SCHOOL_ADMIN: 'Manages staff, students and all records.',
  PRINCIPAL: 'Reviews school-wide risk and interventions; manages enrolment.',
  TEACHER: 'Records attendance and marks; sees assigned students.',
};

export const MIN_PASSWORD_LENGTH = 8;
