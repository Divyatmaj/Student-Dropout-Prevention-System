/**
 * Mock students for the Udaan web app (used only when VITE_USE_MOCKS=true).
 *
 * Shape matches the Udaan API `Student` resource. Fields after the comment
 * "computed by the API" are not stored on the student — the API joins them in
 * from attendance and the current risk assessment for list views.
 *
 * Contract:
 *   GET    /students?search=&grade=&section=&status=&riskCategory=&page=&limit=
 *          → { students: Student[], total, page, limit }
 *   GET    /students/:id            → Student
 *   GET    /students/:id/summary    → { student, attendance, academics, risk, interventions }
 *   POST   /students                → Student   (409 DUPLICATE_STUDENT_CODE)
 *   PATCH  /students/:id            → Student   (409 DUPLICATE_STUDENT_CODE)
 *   PATCH  /students/:id/status     → Student   body { status }
 *
 * IDs are kept stable (STU-xxxx) so links from other mock modules still work.
 */

const CLASS_TEACHER = { id: 'USR-003', name: 'Neha Gupta' };

export const mockStudentsList = [
  {
    id: 'STU-1042',
    studentCode: 'UDN-0142',
    fullName: 'Aarav Sharma',
    dateOfBirth: '2012-03-14',
    grade: '8',
    section: 'A',
    admissionDate: '2021-06-10',
    status: 'ACTIVE',
    guardianName: 'Sunita Sharma',
    guardianPhone: '9876543210',
    guardianRelationship: 'Mother',
    financialBarrierReported: true,
    supportNotes: 'Family reported difficulty paying for transport after a job loss. Check whether bus pass support is available.',
    assignedTeacherId: CLASS_TEACHER.id,
    assignedTeacherName: CLASS_TEACHER.name,
    // computed by the API
    attendanceRate: 61.9,
    riskScore: 75,
    riskCategory: 'HIGH',
    topRiskReason: 'Attendance below 75% (61.9%)',
  },
  {
    id: 'STU-1089',
    studentCode: 'UDN-0189',
    fullName: 'Sneha Patel',
    dateOfBirth: '2011-08-02',
    grade: '9',
    section: 'B',
    admissionDate: '2020-06-12',
    status: 'ACTIVE',
    guardianName: 'Mahesh Patel',
    guardianPhone: '9876543211',
    guardianRelationship: 'Father',
    financialBarrierReported: false,
    supportNotes: '',
    assignedTeacherId: null,
    assignedTeacherName: null,
    attendanceRate: 66.7,
    riskScore: 55,
    riskCategory: 'HIGH',
    topRiskReason: 'Attendance below 75% (66.7%)',
  },
  {
    id: 'STU-1120',
    studentCode: 'UDN-0220',
    fullName: 'Rohan Deshmukh',
    dateOfBirth: '2013-01-21',
    grade: '7',
    section: 'A',
    admissionDate: '2022-06-15',
    status: 'ACTIVE',
    guardianName: 'Kavita Deshmukh',
    guardianPhone: '9876543212',
    guardianRelationship: 'Mother',
    financialBarrierReported: false,
    supportNotes: '',
    assignedTeacherId: CLASS_TEACHER.id,
    assignedTeacherName: CLASS_TEACHER.name,
    attendanceRate: 71.4,
    riskScore: 55,
    riskCategory: 'HIGH',
    topRiskReason: '5 consecutive absences',
  },
  {
    id: 'STU-1194',
    studentCode: 'UDN-0294',
    fullName: 'Ananya Iyer',
    dateOfBirth: '2012-11-09',
    grade: '8',
    section: 'B',
    admissionDate: '2021-06-10',
    status: 'ACTIVE',
    guardianName: 'Lakshmi Iyer',
    guardianPhone: '9876543213',
    guardianRelationship: 'Grandparent',
    financialBarrierReported: false,
    supportNotes: '',
    assignedTeacherId: null,
    assignedTeacherName: null,
    attendanceRate: 81.0,
    riskScore: 35,
    riskCategory: 'MEDIUM',
    topRiskReason: 'Average score dropped 20+ points',
  },
  {
    id: 'STU-1205',
    studentCode: 'UDN-0305',
    fullName: 'Vikram Joshi',
    dateOfBirth: '2011-05-30',
    grade: '9',
    section: 'A',
    admissionDate: '2020-06-12',
    status: 'ACTIVE',
    guardianName: 'Prakash Joshi',
    guardianPhone: '9876543214',
    guardianRelationship: 'Father',
    financialBarrierReported: true,
    supportNotes: 'Works part-time at the family shop on weekday mornings.',
    assignedTeacherId: null,
    assignedTeacherName: null,
    attendanceRate: 81.0,
    riskScore: 25,
    riskCategory: 'MEDIUM',
    topRiskReason: 'Attendance between 75% and 85% (81.0%)',
  },
  {
    id: 'STU-1231',
    studentCode: 'UDN-0331',
    fullName: 'Pooja Verma',
    dateOfBirth: '2012-07-18',
    grade: '8',
    section: 'A',
    admissionDate: '2021-06-10',
    status: 'ACTIVE',
    guardianName: 'Rekha Verma',
    guardianPhone: '9876543215',
    guardianRelationship: 'Mother',
    financialBarrierReported: false,
    supportNotes: '',
    assignedTeacherId: CLASS_TEACHER.id,
    assignedTeacherName: CLASS_TEACHER.name,
    attendanceRate: 76.2,
    riskScore: 25,
    riskCategory: 'MEDIUM',
    topRiskReason: '3 consecutive absences',
  },
  {
    id: 'STU-1011',
    studentCode: 'UDN-0111',
    fullName: 'Priya Nair',
    dateOfBirth: '2013-02-05',
    grade: '7',
    section: 'B',
    admissionDate: '2022-06-15',
    status: 'ACTIVE',
    guardianName: 'Suresh Nair',
    guardianPhone: '9876543216',
    guardianRelationship: 'Father',
    financialBarrierReported: false,
    supportNotes: '',
    assignedTeacherId: null,
    assignedTeacherName: null,
    attendanceRate: 95.2,
    riskScore: 0,
    riskCategory: 'LOW',
    topRiskReason: null,
  },
  {
    id: 'STU-1025',
    studentCode: 'UDN-0125',
    fullName: 'Karthik Rao',
    dateOfBirth: '2011-10-27',
    grade: '9',
    section: 'A',
    admissionDate: '2020-06-12',
    status: 'ACTIVE',
    guardianName: 'Meena Rao',
    guardianPhone: '9876543217',
    guardianRelationship: 'Mother',
    financialBarrierReported: false,
    supportNotes: '',
    assignedTeacherId: null,
    assignedTeacherName: null,
    attendanceRate: 90.5,
    riskScore: 0,
    riskCategory: 'LOW',
    topRiskReason: null,
  },
  {
    id: 'STU-1250',
    studentCode: 'UDN-0350',
    fullName: 'Meera Kulkarni',
    dateOfBirth: '2014-04-12',
    grade: '6',
    section: 'A',
    admissionDate: '2026-11-02',
    status: 'ACTIVE',
    guardianName: 'Anil Kulkarni',
    guardianPhone: '9876543218',
    guardianRelationship: 'Father',
    financialBarrierReported: false,
    supportNotes: 'Joined mid-term from another district.',
    assignedTeacherId: CLASS_TEACHER.id,
    assignedTeacherName: CLASS_TEACHER.name,
    attendanceRate: null,
    riskScore: null,
    riskCategory: 'INSUFFICIENT_DATA',
    topRiskReason: 'Not enough attendance or marks recorded yet',
  },
  {
    id: 'STU-0987',
    studentCode: 'UDN-0087',
    fullName: 'Imran Shaikh',
    dateOfBirth: '2011-12-01',
    grade: '9',
    section: 'B',
    admissionDate: '2020-06-12',
    status: 'TRANSFERRED',
    guardianName: 'Farida Shaikh',
    guardianPhone: '9876543219',
    guardianRelationship: 'Mother',
    financialBarrierReported: false,
    supportNotes: 'Family relocated to Pune in October 2026.',
    assignedTeacherId: null,
    assignedTeacherName: null,
    attendanceRate: 85.7,
    riskScore: null,
    riskCategory: null,
    topRiskReason: null,
  },
];

function toLocalISODate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Build a deterministic list of recent school days (newest first) whose
 * attendance percentage matches `student.attendanceRate`, so the profile and
 * the list agree in mock mode. Late arrivals count as attended.
 */
export function buildMockDailyAttendance(student, days = 21) {
  if (student.attendanceRate === null || student.attendanceRate === undefined) {
    // New admission — only a few days recorded so far.
    return [
      { date: '2026-11-06', status: 'PRESENT', note: '' },
      { date: '2026-11-05', status: 'PRESENT', note: '' },
      { date: '2026-11-04', status: 'LATE', note: 'Arrived 20 minutes late' },
    ];
  }

  const dates = [];
  const cursor = new Date('2026-11-06T00:00:00');
  while (dates.length < days) {
    const weekday = cursor.getDay();
    if (weekday !== 0 && weekday !== 6) dates.push(toLocalISODate(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }

  const statuses = Array(days).fill('PRESENT');
  let absences = Math.round((days * (100 - student.attendanceRate)) / 100);

  // Students flagged for a streak start their recent history with absences.
  const streak = /(\d+) consecutive absences/.exec(student.topRiskReason || '');
  const streakLength = streak ? Number(streak[1]) : 0;
  for (let i = 0; i < streakLength && absences > 0; i += 1) {
    statuses[i] = 'ABSENT';
    absences -= 1;
  }
  if (streakLength < days) statuses[streakLength] = 'PRESENT'; // end the streak

  // Spread the remaining absences evenly through the older days.
  const firstFree = streakLength + 1;
  const span = days - firstFree;
  for (let n = 0; n < absences; n += 1) {
    statuses[firstFree + Math.floor(((n + 0.5) * span) / absences)] = 'ABSENT';
  }

  // A few late arrivals (still counted as attended).
  for (let i = firstFree + 2; i < days; i += 6) {
    if (statuses[i] === 'PRESENT') statuses[i] = 'LATE';
  }

  return dates.map((date, i) => ({
    date,
    status: statuses[i],
    note: statuses[i] === 'LATE' ? 'Arrived after assembly' : '',
  }));
}
