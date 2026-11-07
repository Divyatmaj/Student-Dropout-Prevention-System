/**
 * ============================================================================
 * Backend Contract & Mock Dataset for Academic Performance Module
 * ============================================================================
 * 
 * BACKEND DEVELOPER INTEGRATION NOTES:
 * ----------------------------------------------------------------------------
 * This file models the exact schema for the Express + PostgreSQL backend.
 * 
 * 1. GET /assessments
 *    - Query params supported:
 *        search: string (student name or ID)
 *        department: string
 *        course: string
 *        assessmentType: string
 *        status: 'Pass' | 'Fail'
 *    - Expected Response: {
 *        total: number,
 *        assessments: AssessmentResultItem[]
 *      }
 * 
 * 2. GET /assessments/overview
 *    - Expected Response: {
 *        averageGPA: number,
 *        overallPassRate: number,
 *        studentsWithAcademicAlerts: number,
 *        totalAssessmentsCount: number,
 *        subjectDifficulty: [
 *          {
 *            course: string,
 *            department: string,
 *            passRate: number,
 *            averageScore: number,
 *            maxScore: number,
 *            difficultyLevel: 'Normal' | 'Moderate' | 'High'
 *          }
 *        ]
 *      }
 * 
 * 3. POST /marks
 *    - Request Body: {
 *        studentId: string,
 *        course: string,
 *        assessmentName: string,
 *        assessmentType: 'Mid-Term Exam' | 'Unit Test' | 'Quiz' | 'Lab Practical',
 *        score: number,
 *        maxScore: number,
 *        passingScore: number,
 *        remarks?: string
 *      }
 *    - Expected Response: { success: true, record: AssessmentResultItem }
 * ============================================================================
 */

export const mockAcademicOverview = {
  averageGPA: 7.42,
  overallPassRate: 86.8,
  studentsWithAcademicAlerts: 160,
  totalAssessmentsEvaluated: 18,
  firstAttemptClearance: 79.2,
  subjectDifficulty: [
    {
      course: 'Operating Systems',
      department: 'Computer Science',
      passRate: 68.2,
      averageScore: 17.5,
      maxScore: 25,
      difficultyLevel: 'High',
      flaggedStudentsCount: 28,
    },
    {
      course: 'Structural Mechanics',
      department: 'Civil Engineering',
      passRate: 69.0,
      averageScore: 32.2,
      maxScore: 50,
      difficultyLevel: 'High',
      flaggedStudentsCount: 22,
    },
    {
      course: 'Thermodynamics',
      department: 'Mechanical',
      passRate: 70.5,
      averageScore: 31.5,
      maxScore: 50,
      difficultyLevel: 'Moderate',
      flaggedStudentsCount: 19,
    },
    {
      course: 'Data Structures',
      department: 'Computer Science',
      passRate: 72.4,
      averageScore: 36.2,
      maxScore: 50,
      difficultyLevel: 'Moderate',
      flaggedStudentsCount: 24,
    },
    {
      course: 'Digital Signal Processing',
      department: 'Electronics',
      passRate: 78.5,
      averageScore: 37.0,
      maxScore: 50,
      difficultyLevel: 'Normal',
      flaggedStudentsCount: 14,
    },
    {
      course: 'Database Management',
      department: 'Computer Science',
      passRate: 84.5,
      averageScore: 37.8,
      maxScore: 50,
      difficultyLevel: 'Normal',
      flaggedStudentsCount: 11,
    },
  ],
};

export const mockAssessmentResults = [
  {
    id: 'ASM-101',
    studentId: 'STU-1042',
    studentName: 'Aarav Sharma',
    department: 'Computer Science',
    semester: 4,
    course: 'Data Structures',
    assessmentName: 'Mid-Term Exam',
    assessmentType: 'Mid-Term Exam',
    score: 14,
    maxScore: 50,
    passingScore: 20,
    classAverage: 36.2,
    status: 'Fail',
    date: '2026-11-02',
    academicAlert: 'Critical: 3rd failed core exam. Urgent remedial tutorial recommended.',
  },
  {
    id: 'ASM-102',
    studentId: 'STU-1042',
    studentName: 'Aarav Sharma',
    department: 'Computer Science',
    semester: 4,
    course: 'Database Management',
    assessmentName: 'Unit Test 2',
    assessmentType: 'Unit Test',
    score: 18,
    maxScore: 50,
    passingScore: 20,
    classAverage: 37.8,
    status: 'Fail',
    date: '2026-10-28',
    academicAlert: 'Below passing threshold in SQL schema queries.',
  },
  {
    id: 'ASM-103',
    studentId: 'STU-1042',
    studentName: 'Aarav Sharma',
    department: 'Computer Science',
    semester: 4,
    course: 'Operating Systems',
    assessmentName: 'Process Scheduling Quiz',
    assessmentType: 'Quiz',
    score: 8,
    maxScore: 25,
    passingScore: 10,
    classAverage: 17.5,
    status: 'Fail',
    date: '2026-10-20',
    academicAlert: 'Failed introductory quiz on memory allocation.',
  },
  {
    id: 'ASM-104',
    studentId: 'STU-1089',
    studentName: 'Sneha Patel',
    department: 'Electronics',
    semester: 6,
    course: 'Digital Signal Processing',
    assessmentName: 'Mid-Term Exam',
    assessmentType: 'Mid-Term Exam',
    score: 17,
    maxScore: 50,
    passingScore: 20,
    classAverage: 37.0,
    status: 'Fail',
    date: '2026-11-01',
    academicAlert: 'Failed mid-term evaluation. Faculty counseling scheduled.',
  },
  {
    id: 'ASM-105',
    studentId: 'STU-1120',
    studentName: 'Rohan Deshmukh',
    department: 'Mechanical',
    semester: 2,
    course: 'Thermodynamics',
    assessmentName: 'Heat Transfer Lab Test',
    assessmentType: 'Lab Practical',
    score: 9,
    maxScore: 25,
    passingScore: 10,
    classAverage: 18.2,
    status: 'Fail',
    date: '2026-10-29',
    academicAlert: 'Failed practical lab evaluation due to incomplete reports.',
  },
  {
    id: 'ASM-106',
    studentId: 'STU-1194',
    studentName: 'Ananya Iyer',
    department: 'Civil Engineering',
    semester: 4,
    course: 'Structural Mechanics',
    assessmentName: 'Bending Moments Mid-Term',
    assessmentType: 'Mid-Term Exam',
    score: 19,
    maxScore: 50,
    passingScore: 20,
    classAverage: 32.2,
    status: 'Fail',
    date: '2026-10-25',
    academicAlert: 'Borderline fail (1 mark below cutoff). Review session advised.',
  },
  {
    id: 'ASM-107',
    studentId: 'STU-1205',
    studentName: 'Vikram Joshi',
    department: 'Information Tech',
    semester: 6,
    course: 'Web Architectures',
    assessmentName: 'API Design Unit Test',
    assessmentType: 'Unit Test',
    score: 18,
    maxScore: 50,
    passingScore: 20,
    classAverage: 35.5,
    status: 'Fail',
    date: '2026-10-24',
    academicAlert: 'Needs revision in asynchronous programming models.',
  },
  {
    id: 'ASM-108',
    studentId: 'STU-1011',
    studentName: 'Priya Nair',
    department: 'Computer Science',
    semester: 2,
    course: 'Data Structures',
    assessmentName: 'Mid-Term Exam',
    assessmentType: 'Mid-Term Exam',
    score: 44,
    maxScore: 50,
    passingScore: 20,
    classAverage: 36.2,
    status: 'Pass',
    date: '2026-11-02',
    academicAlert: 'Top decile performance in trees and algorithms.',
  },
  {
    id: 'ASM-109',
    studentId: 'STU-1025',
    studentName: 'Karthik Rao',
    department: 'Electronics',
    semester: 4,
    course: 'Digital Signal Processing',
    assessmentName: 'Mid-Term Exam',
    assessmentType: 'Mid-Term Exam',
    score: 46,
    maxScore: 50,
    passingScore: 20,
    classAverage: 37.0,
    status: 'Pass',
    date: '2026-11-01',
    academicAlert: 'Excellent analytical score in FFT implementations.',
  },
  {
    id: 'ASM-110',
    studentId: 'STU-1231',
    studentName: 'Pooja Verma',
    department: 'Computer Science',
    semester: 4,
    course: 'Database Management',
    assessmentName: 'Unit Test 2',
    assessmentType: 'Unit Test',
    score: 36,
    maxScore: 50,
    passingScore: 20,
    classAverage: 37.8,
    status: 'Pass',
    date: '2026-10-28',
    academicAlert: 'Consistent passing score meeting class standard.',
  },
];
