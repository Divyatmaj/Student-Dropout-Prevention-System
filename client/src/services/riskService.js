import { apiClient, USE_MOCKS, mockDelay, buildQuery } from './api.js';
import { mockRiskOverview, mockRiskStudents } from '../data/mockRiskData.js';

/**
 * Risk distribution and rule criteria.
 * GET /risk/overview
 */
export async function getRiskOverview() {
  if (!USE_MOCKS) return apiClient('/risk/overview');

  await mockDelay(300);
  return mockRiskOverview;
}

/**
 * Students with their risk classification and reasons.
 * GET /risk?tier=...&department=...&trigger=...&search=...
 */
export async function getRiskStudents(filters = {}) {
  const { tier = 'all', department = '', trigger = '', search = '' } = filters;

  if (!USE_MOCKS) {
    return apiClient(`/risk${buildQuery({ tier, department, trigger, search })}`);
  }

  await mockDelay(350);
  let filtered = [...mockRiskStudents];

  if (tier && tier !== 'all') {
    filtered = filtered.filter((s) => s.riskLevel.toLowerCase() === tier.toLowerCase());
  }
  if (department) {
    filtered = filtered.filter((s) => s.department === department);
  }
  if (trigger) {
    filtered = filtered.filter((s) => s.primaryTrigger.toLowerCase().includes(trigger.toLowerCase()));
  }
  if (search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.rollNo.toLowerCase().includes(q) ||
        s.explainableReason.toLowerCase().includes(q)
    );
  }

  return { total: filtered.length, students: filtered };
}

/**
 * Recalculate one student's risk from current attendance & marks.
 * POST /risk/recalculate/:studentId
 */
export async function recalculateStudentRisk(studentId) {
  if (!USE_MOCKS) {
    return apiClient(`/risk/recalculate/${studentId}`, { method: 'POST' });
  }

  await mockDelay(600);
  const student = mockRiskStudents.find((s) => s.id === studentId);
  if (!student) {
    throw new Error(`Student ${studentId} not found.`);
  }

  const previousRisk = student.riskLevel;
  let newRisk;
  let newReason;

  if (student.attendanceRate < 65.0 || student.failedAssessmentsCount >= 3) {
    newRisk = 'high';
    newReason = `Attendance (${student.attendanceRate}%) is under 65% or failed assessments (${student.failedAssessmentsCount}) >= 3. Critical early intervention required.`;
  } else if (student.attendanceRate < 75.0 || student.failedAssessmentsCount > 0) {
    newRisk = 'medium';
    newReason = `Attendance (${student.attendanceRate}%) is between 65% - 75% or student has ${student.failedAssessmentsCount} failed assessment(s). Faculty check-in advised.`;
  } else {
    newRisk = 'low';
    newReason = `Attendance (${student.attendanceRate}%) meets 75% benchmark with 0 failed assessments. On track.`;
  }

  student.riskLevel = newRisk;
  student.explainableReason = newReason;
  student.lastEvaluated = new Date().toISOString().split('T')[0];

  return {
    success: true,
    studentId,
    previousRisk,
    newRisk,
    recalculatedAt: student.lastEvaluated,
    ruleReason: newReason,
  };
}
