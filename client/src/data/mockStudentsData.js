/**
 * ============================================================================
 * Backend Contract & Mock Dataset for Student Management
 * ============================================================================
 * 
 * BACKEND DEVELOPER INTEGRATION NOTES:
 * ----------------------------------------------------------------------------
 * This file serves as the exact schema contract for the Express + PostgreSQL backend.
 * 
 * 1. GET /students
 *    - Query params supported: ?search=...&department=...&riskLevel=...&semester=...
 *    - Expected Response: { total: number, students: StudentListItem[] }
 * 
 * 2. GET /students/:id/summary
 *    - Param: :id (e.g. STU-1042)
 *    - Expected Response: {
 *        student: StudentProfile,
 *        attendance: AttendanceSummary,
 *        academics: AcademicSummary,
 *        interventions: InterventionRecord[]
 *      }
 * 
 * 3. POST /students
 *    - Body: { name, rollNo, email, phone, department, semester }
 *    - Expected Response: { success: true, student: StudentListItem }
 * 
 * RULE-BASED RISK CALCULATION STANDARD:
 * - High Risk: Attendance < 65% OR failedAssessments >= 3
 * - Medium Risk: Attendance 65% - 75% OR failedAssessments in [1, 2]
 * - Low Risk: Attendance > 75% AND failedAssessments === 0
 * ============================================================================
 */

export const mockStudentsList = [
  {
    id: 'STU-1042',
    name: 'Aarav Sharma',
    rollNo: 'CS2023-042',
    email: 'aarav.sharma@institution.edu',
    phone: '+91 98765 43210',
    department: 'Computer Science',
    semester: 4,
    enrollmentYear: 2023,
    attendanceRate: 52.8,
    gpa: 5.4,
    failedAssessmentsCount: 3,
    riskLevel: 'high',
    riskReason: 'Critical attendance below 65% (52.8%) and 3 failed core unit tests.',
  },
  {
    id: 'STU-1089',
    name: 'Sneha Patel',
    rollNo: 'EC2022-089',
    email: 'sneha.patel@institution.edu',
    phone: '+91 98765 43211',
    department: 'Electronics',
    semester: 6,
    enrollmentYear: 2022,
    attendanceRate: 58.0,
    gpa: 6.1,
    failedAssessmentsCount: 2,
    riskLevel: 'high',
    riskReason: 'Rapid attendance drop in last 30 days and 2 failed mid-term evaluations.',
  },
  {
    id: 'STU-1120',
    name: 'Rohan Deshmukh',
    rollNo: 'ME2024-120',
    email: 'rohan.deshmukh@institution.edu',
    phone: '+91 98765 43212',
    department: 'Mechanical',
    semester: 2,
    enrollmentYear: 2024,
    attendanceRate: 61.5,
    gpa: 5.8,
    failedAssessmentsCount: 2,
    riskLevel: 'high',
    riskReason: 'Chronic absence pattern (< 65%) with 2 failed lab evaluations.',
  },
  {
    id: 'STU-1194',
    name: 'Ananya Iyer',
    rollNo: 'CE2023-194',
    email: 'ananya.iyer@institution.edu',
    phone: '+91 98765 43213',
    department: 'Civil Engineering',
    semester: 4,
    enrollmentYear: 2023,
    attendanceRate: 67.2,
    gpa: 6.7,
    failedAssessmentsCount: 2,
    riskLevel: 'medium',
    riskReason: 'Borderline attendance (67.2%) and declining grades in Structural Mechanics.',
  },
  {
    id: 'STU-1205',
    name: 'Vikram Joshi',
    rollNo: 'IT2022-205',
    email: 'vikram.joshi@institution.edu',
    phone: '+91 98765 43214',
    department: 'Information Tech',
    semester: 6,
    enrollmentYear: 2022,
    attendanceRate: 69.8,
    gpa: 6.9,
    failedAssessmentsCount: 1,
    riskLevel: 'medium',
    riskReason: 'Attendance approaching critical threshold (69.8%) with 1 failed quiz.',
  },
  {
    id: 'STU-1231',
    name: 'Pooja Verma',
    rollNo: 'CS2023-231',
    email: 'pooja.verma@institution.edu',
    phone: '+91 98765 43215',
    department: 'Computer Science',
    semester: 4,
    enrollmentYear: 2023,
    attendanceRate: 72.4,
    gpa: 7.1,
    failedAssessmentsCount: 1,
    riskLevel: 'medium',
    riskReason: 'Attendance below institutional benchmark (72.4%) in Operating Systems.',
  },
  {
    id: 'STU-1011',
    name: 'Priya Nair',
    rollNo: 'CS2024-011',
    email: 'priya.nair@institution.edu',
    phone: '+91 98765 43216',
    department: 'Computer Science',
    semester: 2,
    enrollmentYear: 2024,
    attendanceRate: 88.5,
    gpa: 8.6,
    failedAssessmentsCount: 0,
    riskLevel: 'low',
    riskReason: 'Consistent attendance (> 85%) and strong academic performance across all tests.',
  },
  {
    id: 'STU-1025',
    name: 'Karthik Rao',
    rollNo: 'EC2023-025',
    email: 'karthik.rao@institution.edu',
    phone: '+91 98765 43217',
    department: 'Electronics',
    semester: 4,
    enrollmentYear: 2023,
    attendanceRate: 91.2,
    gpa: 8.9,
    failedAssessmentsCount: 0,
    riskLevel: 'low',
    riskReason: 'High attendance (> 90%) and top-quartile assessment rankings.',
  },
];

/**
 * Detailed profile summaries indexed by student ID for GET /students/:id/summary
 */
export const mockStudentProfiles = {
  'STU-1042': {
    student: {
      id: 'STU-1042',
      name: 'Aarav Sharma',
      rollNo: 'CS2023-042',
      email: 'aarav.sharma@institution.edu',
      phone: '+91 98765 43210',
      department: 'Computer Science',
      semester: 4,
      enrollmentYear: 2023,
      mentorName: 'Dr. Radhika Sharma',
      status: 'Active',
      riskLevel: 'high',
      riskReason: 'Critical attendance below 65% (52.8%) and 3 failed core unit tests.',
    },
    attendance: {
      overallRate: 52.8,
      totalSessions: 90,
      attendedSessions: 48,
      absentSessions: 38,
      excusedSessions: 4,
      criticalThreshold: 65.0,
      institutionalBenchmark: 75.0,
      recentLogs: [
        { date: '2026-11-06', subject: 'Data Structures', status: 'Absent', hours: 2 },
        { date: '2026-11-05', subject: 'Database Management', status: 'Absent', hours: 2 },
        { date: '2026-11-04', subject: 'Computer Networks', status: 'Present', hours: 1 },
        { date: '2026-11-03', subject: 'Operating Systems', status: 'Absent', hours: 2 },
        { date: '2026-11-02', subject: 'Data Structures Lab', status: 'Present', hours: 2 },
        { date: '2026-10-31', subject: 'Software Engineering', status: 'Excused', hours: 1 },
      ],
    },
    academics: {
      gpa: 5.4,
      percentage: 54.2,
      totalAssessments: 6,
      passedAssessments: 3,
      failedAssessments: 3,
      records: [
        { subject: 'Data Structures', assessment: 'Mid-Term Exam', score: 14, maxScore: 50, passingScore: 20, classAverage: 36.2, status: 'Fail' },
        { subject: 'Database Management', assessment: 'Unit Test 2', score: 18, maxScore: 50, passingScore: 20, classAverage: 37.8, status: 'Fail' },
        { subject: 'Operating Systems', assessment: 'Quiz 1', score: 8, maxScore: 25, passingScore: 10, classAverage: 17.5, status: 'Fail' },
        { subject: 'Computer Networks', assessment: 'Mid-Term Exam', score: 28, maxScore: 50, passingScore: 20, classAverage: 34.0, status: 'Pass' },
        { subject: 'Software Engineering', assessment: 'Mid-Term Exam', score: 31, maxScore: 50, passingScore: 20, classAverage: 35.5, status: 'Pass' },
        { subject: 'Web Technologies', assessment: 'Lab Practical', score: 21, maxScore: 25, passingScore: 10, classAverage: 19.8, status: 'Pass' },
      ],
    },
    interventions: [
      {
        id: 'INT-401',
        date: '2026-11-05',
        type: 'Academic Counseling',
        counselor: 'Dr. Radhika Sharma',
        priority: 'urgent',
        status: 'pending',
        notes: 'Student reported difficulty keeping up with algorithmic assignments after illness. Recommended remedial lab sessions.',
      },
      {
        id: 'INT-360',
        date: '2026-10-18',
        type: 'Attendance Notice',
        counselor: 'Dean Office',
        priority: 'high',
        status: 'completed',
        notes: 'First stage automated attendance warning letter sent via email.',
      },
    ],
  },
};

/**
 * Fallback generator for student IDs not explicitly mocked in detail
 */
export function generateStudentProfileFallback(studentId) {
  const basic = mockStudentsList.find((s) => s.id === studentId) || {
    id: studentId,
    name: 'Sample Student',
    rollNo: 'GEN-2024-001',
    email: 'student@institution.edu',
    phone: '+91 99999 00000',
    department: 'General Engineering',
    semester: 2,
    enrollmentYear: 2024,
    mentorName: 'Faculty Advisor',
    status: 'Active',
    riskLevel: 'medium',
    riskReason: 'Attendance or assessment indicators require faculty evaluation.',
    attendanceRate: 71.0,
    gpa: 6.5,
    failedAssessmentsCount: 1,
  };

  return {
    student: {
      ...basic,
      mentorName: 'Prof. Faculty Advisor',
      status: 'Active',
    },
    attendance: {
      overallRate: basic.attendanceRate || 71.0,
      totalSessions: 80,
      attendedSessions: Math.round((80 * (basic.attendanceRate || 71.0)) / 100),
      absentSessions: 80 - Math.round((80 * (basic.attendanceRate || 71.0)) / 100),
      excusedSessions: 2,
      criticalThreshold: 65.0,
      institutionalBenchmark: 75.0,
      recentLogs: [
        { date: '2026-11-06', subject: 'Core Course 1', status: 'Present', hours: 2 },
        { date: '2026-11-05', subject: 'Core Course 2', status: 'Present', hours: 1 },
        { date: '2026-11-04', subject: 'Applied Lab', status: 'Absent', hours: 2 },
        { date: '2026-11-03', subject: 'Mathematics', status: 'Present', hours: 2 },
      ],
    },
    academics: {
      gpa: basic.gpa || 6.8,
      percentage: Math.round((basic.gpa || 6.8) * 9.5),
      totalAssessments: 4,
      passedAssessments: 4 - (basic.failedAssessmentsCount || 0),
      failedAssessments: basic.failedAssessmentsCount || 0,
      records: [
        { subject: 'Core Subject 1', assessment: 'Mid-Term', score: 32, maxScore: 50, passingScore: 20, classAverage: 35.0, status: 'Pass' },
        { subject: 'Applied Lab', assessment: 'Practical', score: 19, maxScore: 25, passingScore: 10, classAverage: 18.0, status: 'Pass' },
        { subject: 'Technical Elective', assessment: 'Unit Test', score: 16, maxScore: 50, passingScore: 20, classAverage: 32.0, status: (basic.failedAssessmentsCount > 0 ? 'Fail' : 'Pass') },
      ],
    },
    interventions: [],
  };
}
