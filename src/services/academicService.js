import { apiClient } from './api.js';
import {
  mockAcademicOverview,
  mockAssessmentResults,
} from '../data/mockAcademicsData.js';

/**
 * Service to interact with the Academic Performance & Assessment API.
 * Prepared for Express + PostgreSQL backend integration.
 */

/**
 * Fetch high-level academic performance overview
 * Target: GET /assessments/overview
 */
export async function getAcademicOverview() {
  try {
    const data = await apiClient('/assessments/overview');
    return data;
  } catch (error) {
    console.info(
      '[Udaan Service] Express backend at /assessments/overview not reachable. Using mock academic overview.',
      error.message
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockAcademicOverview;
  }
}

/**
 * Fetch filtered assessment records & scores
 * Target: GET /assessments?search=...&department=...&course=...&assessmentType=...&status=...
 */
export async function getAssessmentResults(filters = {}) {
  const {
    search = '',
    department = '',
    course = '',
    assessmentType = '',
    status = '',
  } = filters;

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (department) queryParams.set('department', department);
  if (course) queryParams.set('course', course);
  if (assessmentType) queryParams.set('assessmentType', assessmentType);
  if (status) queryParams.set('status', status);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  try {
    const data = await apiClient(`/assessments${queryString}`);
    return data;
  } catch (error) {
    console.info(
      `[Udaan Service] Express backend at /assessments${queryString} not reachable. Using local mock dataset.`,
      error.message
    );

    await new Promise((resolve) => setTimeout(resolve, 350));

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

    return {
      total: filtered.length,
      assessments: filtered,
    };
  }
}

/**
 * Record evaluation marks for a student assessment
 * Target: POST /marks
 */
export async function recordMarks(marksData) {
  try {
    const data = await apiClient('/marks', {
      method: 'POST',
      body: JSON.stringify(marksData),
    });
    return data;
  } catch (error) {
    console.info(
      '[Udaan Service] Express backend at POST /marks not reachable. Prepending to mock results.',
      error.message
    );

    await new Promise((resolve) => setTimeout(resolve, 400));

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

    return {
      success: true,
      record: newRecord,
    };
  }
}
