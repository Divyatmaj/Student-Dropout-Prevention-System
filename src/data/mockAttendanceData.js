/**
 * ============================================================================
 * Backend Contract & Mock Dataset for Attendance Module
 * ============================================================================
 * 
 * BACKEND DEVELOPER INTEGRATION NOTES:
 * ----------------------------------------------------------------------------
 * This file models the exact schema for the Express + PostgreSQL backend.
 * 
 * 1. GET /attendance/overview
 *    - Expected Response: {
 *        overallRate: number,
 *        totalSessionsLogged: number,
 *        cohortSummary: {
 *          safeCount: number,       // > 75%
 *          warningCount: number,    // 65% - 75%
 *          criticalCount: number    // < 65%
 *        },
 *        departmentRates: [
 *          { department: string, rate: number, status: 'safe' | 'warning' | 'critical' }
 *        ]
 *      }
 * 
 * 2. GET /attendance/records?date=...&student=...&course=...&status=...
 *    - Query params supported:
 *        date: YYYY-MM-DD
 *        student: string (name or studentId)
 *        course: string
 *        status: 'Present' | 'Absent' | 'Late' | 'Excused'
 *    - Expected Response: { total: number, records: AttendanceRecordItem[] }
 * 
 * 3. POST /attendance
 *    - Request Body: {
 *        studentId: string,
 *        course: string,
 *        date: string,
 *        status: 'Present' | 'Absent' | 'Late' | 'Excused',
 *        durationHours: number,
 *        remarks?: string
 *      }
 *    - Expected Response: { success: true, record: AttendanceRecordItem }
 * ============================================================================
 */

export const mockAttendanceOverview = {
  overallRate: 78.4,
  totalSessionsLogged: 1420,
  cohortSummary: {
    safeCount: 1088,
    safePercentage: 87.2,
    warningCount: 118,
    warningPercentage: 9.5,
    criticalCount: 42,
    criticalPercentage: 3.4,
  },
  departmentRates: [
    { department: 'Computer Science', rate: 82.5, status: 'safe' },
    { department: 'Electronics', rate: 77.8, status: 'safe' },
    { department: 'Information Tech', rate: 76.2, status: 'safe' },
    { department: 'Mechanical', rate: 74.1, status: 'warning' },
    { department: 'Civil Engineering', rate: 71.5, status: 'warning' },
  ],
};

export const mockAttendanceRecords = [
  {
    id: 'ATT-9041',
    date: '2026-11-06',
    time: '09:00 AM',
    studentId: 'STU-1042',
    studentName: 'Aarav Sharma',
    department: 'Computer Science',
    semester: 4,
    course: 'Data Structures',
    facultyName: 'Dr. N. Kulkarni',
    durationHours: 2,
    status: 'Absent',
    remarks: 'Unexcused absence - third consecutive missed lecture',
  },
  {
    id: 'ATT-9040',
    date: '2026-11-06',
    time: '09:00 AM',
    studentId: 'STU-1011',
    studentName: 'Priya Nair',
    department: 'Computer Science',
    semester: 2,
    course: 'Data Structures',
    facultyName: 'Dr. N. Kulkarni',
    durationHours: 2,
    status: 'Present',
    remarks: 'Active lab participation',
  },
  {
    id: 'ATT-9039',
    date: '2026-11-06',
    time: '11:30 AM',
    studentId: 'STU-1089',
    studentName: 'Sneha Patel',
    department: 'Electronics',
    semester: 6,
    course: 'Digital Signal Processing',
    facultyName: 'Prof. Amit Verma',
    durationHours: 1,
    status: 'Absent',
    remarks: 'Absent without prior intimation',
  },
  {
    id: 'ATT-9038',
    date: '2026-11-06',
    time: '11:30 AM',
    studentId: 'STU-1025',
    studentName: 'Karthik Rao',
    department: 'Electronics',
    semester: 4,
    course: 'Digital Signal Processing',
    facultyName: 'Prof. Amit Verma',
    durationHours: 1,
    status: 'Present',
    remarks: 'On time',
  },
  {
    id: 'ATT-9037',
    date: '2026-11-05',
    time: '10:00 AM',
    studentId: 'STU-1042',
    studentName: 'Aarav Sharma',
    department: 'Computer Science',
    semester: 4,
    course: 'Database Management',
    facultyName: 'Prof. Meera Sen',
    durationHours: 2,
    status: 'Absent',
    remarks: 'Missed SQL practical assignment',
  },
  {
    id: 'ATT-9036',
    date: '2026-11-05',
    time: '10:00 AM',
    studentId: 'STU-1205',
    studentName: 'Vikram Joshi',
    department: 'Information Tech',
    semester: 6,
    course: 'Database Management',
    facultyName: 'Prof. Meera Sen',
    durationHours: 2,
    status: 'Late',
    remarks: 'Arrived 25 minutes late due to transit delay',
  },
  {
    id: 'ATT-9035',
    date: '2026-11-05',
    time: '02:00 PM',
    studentId: 'STU-1120',
    studentName: 'Rohan Deshmukh',
    department: 'Mechanical',
    semester: 2,
    course: 'Thermodynamics',
    facultyName: 'Dr. Sandeep Patil',
    durationHours: 2,
    status: 'Absent',
    remarks: 'Failed to attend lab session',
  },
  {
    id: 'ATT-9034',
    date: '2026-11-04',
    time: '09:00 AM',
    studentId: 'STU-1194',
    studentName: 'Ananya Iyer',
    department: 'Civil Engineering',
    semester: 4,
    course: 'Structural Mechanics',
    facultyName: 'Prof. H. Banerjee',
    durationHours: 2,
    status: 'Excused',
    remarks: 'Medical leave certificate submitted to department office',
  },
  {
    id: 'ATT-9033',
    date: '2026-11-04',
    time: '11:00 AM',
    studentId: 'STU-1042',
    studentName: 'Aarav Sharma',
    department: 'Computer Science',
    semester: 4,
    course: 'Computer Networks',
    facultyName: 'Prof. Rajesh K.',
    durationHours: 1,
    status: 'Present',
    remarks: 'Attended session',
  },
  {
    id: 'ATT-9032',
    date: '2026-11-03',
    time: '01:30 PM',
    studentId: 'STU-1231',
    studentName: 'Pooja Verma',
    department: 'Computer Science',
    semester: 4,
    course: 'Operating Systems',
    facultyName: 'Dr. Radhika Sharma',
    durationHours: 2,
    status: 'Late',
    remarks: 'Late entry after campus sports event',
  },
];
