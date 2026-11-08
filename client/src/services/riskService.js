import { apiClient } from './api.js';
import { mockRiskOverview, mockRiskStudents } from '../data/mockRiskData.js';

/**
 * Service to interact with the Risk Monitoring API.
 * Prepared for Express + PostgreSQL backend integration.
 */

/**
 * Fetch high-level institutional risk distribution & rule criteria
 * Target: GET /risk/overview
 */
export async function getRiskOverview() {
  try {
    const data = await apiClient('/risk/overview');
    return data;
  } catch (error) {
    console.info(
      '[Udaan Service] Express backend at /risk/overview not reachable. Using mock risk overview.',
      error.message
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockRiskOverview;
  }
}

/**
 * Fetch students categorized by explainable risk indicators
 * Target: GET /risk?tier=...&department=...&trigger=...&search=...
 */
export async function getRiskStudents(filters = {}) {
  const { tier = 'all', department = '', trigger = '', search = '' } = filters;

  const queryParams = new URLSearchParams();
  if (tier && tier !== 'all') queryParams.set('tier', tier);
  if (department) queryParams.set('department', department);
  if (trigger) queryParams.set('trigger', trigger);
  if (search) queryParams.set('search', search);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  try {
    const data = await apiClient(`/risk${queryString}`);
    return data;
  } catch (error) {
    console.info(
      `[Udaan Service] Express backend at /risk${queryString} not reachable. Using local mock dataset.`,
      error.message
    );

    await new Promise((resolve) => setTimeout(resolve, 350));

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

    return {
      total: filtered.length,
      students: filtered,
    };
  }
}

/**
 * Recalculate deterministic risk status for a student against current attendance & marks
 * Target: POST /risk/recalculate/:studentId
 */
export async function recalculateStudentRisk(studentId) {
  try {
    const data = await apiClient(`/risk/recalculate/${studentId}`, {
      method: 'POST',
    });
    return data;
  } catch (error) {
    console.info(
      `[Udaan Service] Express backend at POST /risk/recalculate/${studentId} not reachable. Simulating deterministic rule recalculation.`,
      error.message
    );

    await new Promise((resolve) => setTimeout(resolve, 600));

    const student = mockRiskStudents.find((s) => s.id === studentId);
    if (!student) {
      throw new Error(`Student ${studentId} not found in roster.`);
    }

    // Deterministic Rule evaluation:
    let newRisk = 'low';
    let newReason = '';

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
      previousRisk: student.riskLevel,
      newRisk,
      recalculatedAt: student.lastEvaluated,
      ruleReason: newReason,
    };
  }
}
