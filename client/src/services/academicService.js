import { apiClient, USE_MOCKS, mockDelay, buildQuery } from './api.js';
import {
  mockAcademicOverview,
  mockAssessmentResults,
} from '../data/mockAcademicsData.js';

/**
 * Academic performance overview.
 * GET /assessments/overview
 */
export async function getAcademicOverview() {
  if (!USE_MOCKS) return apiClient('/assessments/overview');

  await mockDelay(300);
  return mockAcademicOverview;
}

/**
 * Filtered assessment results.
 * GET /assessments?search=...&department=...&course=...&assessmentType=...&status=...
 */
export async function getAssessmentResults(filters = {}) {
  const { search = '', department = '', course = '', assessmentType = '', status = '' } = filters;

  if (!USE_MOCKS) {
    return apiClient(
      `/assessments${buildQuery({ search, department, course, assessmentType, status })}`
    );
  }

  await mockDelay(350);
  let filtered = [...mockAssessmentResults];

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) ||
        r.studentId.toLowerCase().includes(q) ||
        r.assessmentName.toLowerCase().includes(q)
    );
  }
  if (department) {
    filtered = filtered.filter((r) => r.department === department);
  }
  if (course) {
    filtered = filtered.filter((r) => r.course === course);
  }
  if (assessmentType) {
    filtered = filtered.filter((r) => r.assessmentType === assessmentType);
  }
  if (status) {
    filtered = filtered.filter((r) => r.status.toLowerCase() === status.toLowerCase());
  }

  return { total: filtered.length, assessments: filtered };
}

/**
 * Record a student's marks.
 * POST /marks
 */
export async function recordMarks(marksData) {
  if (!USE_MOCKS) {
    return apiClient('/marks', { method: 'POST', body: JSON.stringify(marksData) });
  }

  await mockDelay(400);
  const scoreNum = parseFloat(marksData.score);
  const passingNum = parseFloat(marksData.passingScore) || 20;
  const isPassing = scoreNum >= passingNum;

  const newRecord = {
    id: `ASM-${Math.floor(100 + Math.random() * 900)}`,
    studentId: marksData.studentId,
    studentName: marksData.studentName || 'Student',
    department: marksData.department || 'Engineering',
    semester: parseInt(marksData.semester, 10) || 4,
    course: marksData.course,
    assessmentName: marksData.assessmentName,
    assessmentType: marksData.assessmentType || 'Unit Test',
    score: scoreNum,
    maxScore: parseFloat(marksData.maxScore) || 50,
    passingScore: passingNum,
    classAverage: 35.0,
    status: isPassing ? 'Pass' : 'Fail',
    date: marksData.date || new Date().toISOString().split('T')[0],
    academicAlert: isPassing
      ? 'Satisfactory evaluation. Criteria met.'
      : 'Score fell below passing threshold. Review required.',
  };
  mockAssessmentResults.unshift(newRecord);

  return { success: true, record: newRecord };
}
