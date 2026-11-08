/**
 * ============================================================================
 * Backend Contract & Mock Dataset for Risk Monitoring Module
 * ============================================================================
 * 
 * BACKEND DEVELOPER INTEGRATION NOTES:
 * ----------------------------------------------------------------------------
 * This file models the exact schema for the Express + PostgreSQL backend.
 * 
 * 1. GET /risk
 *    - Query params supported:
 *        tier: 'all' | 'high' | 'medium' | 'low'
 *        department: string
 *        trigger: string
 *        search: string
 *    - Expected Response: {
 *        overview: {
 *          totalMonitored: number,
 *          highRiskCount: number,
 *          highRiskPercentage: number,
 *          mediumRiskCount: number,
 *          mediumRiskPercentage: number,
 *          lowRiskCount: number,
 *          lowRiskPercentage: number,
 *          ruleCriteria: {
 *            high: string,
 *            medium: string,
 *            low: string
 *          }
 *        },
 *        students: RiskAssessedStudent[]
 *      }
 * 
 * 2. POST /risk/recalculate/:studentId
 *    - Recalculates risk classification based on the latest attendance and marks in PostgreSQL.
 *    - Expected Response: {
 *        success: true,
 *        studentId: string,
 *        previousRisk: string,
 *        newRisk: string,
 *        recalculatedAt: string,
 *        ruleReason: string
 *      }
 * 
 * EXPLAINABLE RULE STANDARD (Deterministic & Transparent):
 * - High Risk: Attendance < 65.0% OR failedAssessments >= 3
 * - Medium Risk: Attendance 65.0% - 75.0% OR failedAssessments in [1, 2]
 * - Low Risk: Attendance > 75.0% AND failedAssessments === 0
 * ============================================================================
 */

export const mockRiskOverview = {
  totalMonitored: 1248,
  highRiskCount: 42,
  highRiskPercentage: 3.4,
  mediumRiskCount: 118,
  mediumRiskPercentage: 9.5,
  lowRiskCount: 1088,
  lowRiskPercentage: 87.1,
  ruleCriteria: {
    high: 'Attendance < 65% OR ≥ 3 failed assessments. Immediate faculty & parent intervention required.',
    medium: 'Attendance between 65% – 75% OR 1–2 failed assessments. Proactive check-in and academic monitoring.',
    low: 'Attendance > 75% AND 0 failed assessments. On-track academic progression.',
  },
};

export const mockRiskStudents = [
  {
    id: 'STU-1042',
    name: 'Aarav Sharma',
    rollNo: 'CS2023-042',
    email: 'aarav.sharma@institution.edu',
    department: 'Computer Science',
    semester: 4,
    riskLevel: 'high',
    primaryTrigger: 'Dual Critical Breach (Attendance & Academics)',
    attendanceRate: 52.8,
    attendanceThresholdStatus: 'Critical (< 65%)',
    failedAssessmentsCount: 3,
    gpa: 5.4,
    explainableReason:
      'Attendance is 52.8% (38 missed sessions out of 90), breaching the 65% critical threshold. In addition, student failed 3 consecutive core assessments (Data Structures, DBMS, OS).',
    recommendedAction: 'Schedule urgent counselor meeting with Dr. Radhika and notify parents.',
    lastEvaluated: '2026-11-06',
  },
  {
    id: 'STU-1089',
    name: 'Sneha Patel',
    rollNo: 'EC2022-089',
    email: 'sneha.patel@institution.edu',
    department: 'Electronics',
    semester: 6,
    riskLevel: 'high',
    primaryTrigger: 'Chronic Absenteeism Trend',
    attendanceRate: 58.0,
    attendanceThresholdStatus: 'Critical (< 65%)',
    failedAssessmentsCount: 2,
    gpa: 6.1,
    explainableReason:
      'Sharp 18% attendance decline over the last 30 days bringing cumulative attendance to 58.0%. Failed DSP Mid-Term examination with score of 17/50 (cutoff: 20).',
    recommendedAction: 'Issue formal attendance warning notice and assign faculty mentor check-in.',
    lastEvaluated: '2026-11-06',
  },
  {
    id: 'STU-1120',
    name: 'Rohan Deshmukh',
    rollNo: 'ME2024-120',
    email: 'rohan.deshmukh@institution.edu',
    department: 'Mechanical',
    semester: 2,
    riskLevel: 'high',
    primaryTrigger: 'Unexcused Lab Absences & Practical Failure',
    attendanceRate: 61.5,
    attendanceThresholdStatus: 'Critical (< 65%)',
    failedAssessmentsCount: 2,
    gpa: 5.8,
    explainableReason:
      'Overall attendance is 61.5%. Missed mandatory thermodynamics lab sessions resulting in an automatic failure in the lab practical exam (score 9/25).',
    recommendedAction: 'Schedule remedial lab practical session and verify medical documentation.',
    lastEvaluated: '2026-11-05',
  },
  {
    id: 'STU-1194',
    name: 'Ananya Iyer',
    rollNo: 'CE2023-194',
    email: 'ananya.iyer@institution.edu',
    department: 'Civil Engineering',
    semester: 4,
    riskLevel: 'medium',
    primaryTrigger: 'Borderline Attendance & Core Course Failure',
    attendanceRate: 67.2,
    attendanceThresholdStatus: 'Warning (65%–75%)',
    failedAssessmentsCount: 2,
    gpa: 6.7,
    explainableReason:
      'Attendance is in the warning band at 67.2% (below 75% benchmark). Scored 19/50 in Structural Mechanics mid-term (1 mark below passing cutoff of 20).',
    recommendedAction: 'Conduct department faculty review and provide supplementary tutorial notes.',
    lastEvaluated: '2026-11-05',
  },
  {
    id: 'STU-1205',
    name: 'Vikram Joshi',
    rollNo: 'IT2022-205',
    email: 'vikram.joshi@institution.edu',
    department: 'Information Tech',
    semester: 6,
    riskLevel: 'medium',
    primaryTrigger: 'Attendance Benchmark Warning',
    attendanceRate: 69.8,
    attendanceThresholdStatus: 'Warning (65%–75%)',
    failedAssessmentsCount: 1,
    gpa: 6.9,
    explainableReason:
      'Cumulative attendance at 69.8% is below institutional 75% cutoff. Student failed 1 quiz in Web Architectures but maintains a satisfactory overall GPA (6.9).',
    recommendedAction: 'Send automated attendance advisory email via coordinator portal.',
    lastEvaluated: '2026-11-04',
  },
  {
    id: 'STU-1231',
    name: 'Pooja Verma',
    rollNo: 'CS2023-231',
    email: 'pooja.verma@institution.edu',
    department: 'Computer Science',
    semester: 4,
    riskLevel: 'medium',
    primaryTrigger: 'Declining Attendance in Core Subject',
    attendanceRate: 72.4,
    attendanceThresholdStatus: 'Warning (65%–75%)',
    failedAssessmentsCount: 1,
    gpa: 7.1,
    explainableReason:
      'Attendance has dipped to 72.4% with missed lectures in Operating Systems. Overall GPA is strong (7.1) but subject attendance requires monitoring.',
    recommendedAction: 'Inform course instructor to monitor upcoming lecture presence.',
    lastEvaluated: '2026-11-03',
  },
  {
    id: 'STU-1011',
    name: 'Priya Nair',
    rollNo: 'CS2024-011',
    email: 'priya.nair@institution.edu',
    department: 'Computer Science',
    semester: 2,
    riskLevel: 'low',
    primaryTrigger: 'Satisfactory Performance',
    attendanceRate: 88.5,
    attendanceThresholdStatus: 'Safe (> 75%)',
    failedAssessmentsCount: 0,
    gpa: 8.6,
    explainableReason:
      'High attendance rate (88.5%) and strong exam marks (GPA 8.6). Cleared all assessments on the first attempt with top quartile scores.',
    recommendedAction: 'No intervention required. Retain in peer tutoring pool.',
    lastEvaluated: '2026-11-06',
  },
  {
    id: 'STU-1025',
    name: 'Karthik Rao',
    rollNo: 'EC2023-025',
    email: 'karthik.rao@institution.edu',
    department: 'Electronics',
    semester: 4,
    riskLevel: 'low',
    primaryTrigger: 'High Retention Benchmark',
    attendanceRate: 91.2,
    attendanceThresholdStatus: 'Safe (> 75%)',
    failedAssessmentsCount: 0,
    gpa: 8.9,
    explainableReason:
      'Exemplary attendance at 91.2% with 0 missed lab sessions. GPA 8.9 with top score of 46/50 in Digital Signal Processing.',
    recommendedAction: 'Eligible for academic honors and student mentorship role.',
    lastEvaluated: '2026-11-06',
  },
];
