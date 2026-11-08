import { apiClient, ApiError, USE_MOCKS, mockDelay, buildQuery } from './api.js';
import { getMockSessionUser } from './authService.js';
import { mockStudentsList } from '../data/mockStudentsData.js';
import {
  mockRiskAssessments,
  recalculateMockRisk,
  recalculateAllMockRisk,
  needsReview,
} from '../data/mockRiskStore.js';

/*
 * Risk assessment resource (API shape):
 * {
 *   studentId, score, category, dataStatus, dataGaps: string[],
 *   reasons: [{ code, label, points }], indicators: {...},
 *   calculatedAt, changedAt, humanReviewRequired: true,
 *   reviewedAt, reviewedById, reviewedByName, reviewNote, needsReview,
 *   student: { id, fullName, studentCode, grade, section }
 * }
 */

function withStudent(assessment) {
  const s = mockStudentsList.find((st) => st.id === assessment.studentId);
  return {
    ...assessment,
    needsReview: needsReview(assessment),
    student: s
      ? { id: s.id, fullName: s.fullName, studentCode: s.studentCode, grade: s.grade, section: s.section }
      : null,
  };
}

function notFound() {
  return new ApiError({
    status: 404,
    code: 'RISK_NOT_FOUND',
    message: 'No risk assessment for this student. Only active students are assessed.',
  });
}

/**
 * Counts for the risk summary cards.
 * GET /risk/overview
 * → { counts: { HIGH, MEDIUM, LOW, INSUFFICIENT_DATA }, provisional, awaitingReview, lastCalculatedAt }
 */
export async function getRiskOverview() {
  if (!USE_MOCKS) return apiClient('/risk/overview');

  await mockDelay(250);
  const all = [...mockRiskAssessments.values()];
  const counts = { HIGH: 0, MEDIUM: 0, LOW: 0, INSUFFICIENT_DATA: 0 };
  all.forEach((a) => {
    counts[a.category] += 1;
  });
  return {
    counts,
    provisional: all.filter((a) => a.dataStatus === 'PROVISIONAL').length,
    awaitingReview: all.filter(needsReview).length,
    lastCalculatedAt: all.reduce((max, a) => (a.calculatedAt > max ? a.calculatedAt : max), '') || null,
  };
}

/**
 * Current risk assessments, highest score first.
 * GET /risk?category=&dataStatus=&grade=&section=&review=needs|reviewed&search=
 * → { assessments, total }
 */
export async function getRiskList(filters = {}) {
  const { category = '', dataStatus = '', grade = '', section = '', review = '', search = '' } = filters;

  if (!USE_MOCKS) {
    return apiClient(`/risk${buildQuery({ category, dataStatus, grade, section, review, search })}`);
  }

  await mockDelay(300);
  const q = search.trim().toLowerCase();
  const order = { HIGH: 0, MEDIUM: 1, LOW: 2, INSUFFICIENT_DATA: 3 };
  const assessments = [...mockRiskAssessments.values()]
    .map(withStudent)
    .filter(
      (a) =>
        a.student &&
        (!category || a.category === category) &&
        (!dataStatus || a.dataStatus === dataStatus) &&
        (!grade || a.student.grade === grade) &&
        (!section || a.student.section === section) &&
        (!review || (review === 'needs' ? a.needsReview : !a.needsReview && a.reviewedAt)) &&
        (!q || a.student.fullName.toLowerCase().includes(q) || a.student.studentCode.toLowerCase().includes(q))
    )
    .sort((a, b) => order[a.category] - order[b.category] || b.score - a.score || a.student.fullName.localeCompare(b.student.fullName));

  return { assessments, total: assessments.length };
}

/**
 * One student's current risk assessment.
 * GET /risk/:studentId
 */
export async function getStudentRisk(studentId) {
  if (!USE_MOCKS) return apiClient(`/risk/${studentId}`);

  await mockDelay(200);
  const assessment = mockRiskAssessments.get(studentId);
  if (!assessment) throw notFound();
  return withStudent(assessment);
}

/**
 * Recalculate one student's risk from their current records.
 * POST /risk/recalculate/:studentId → { assessment, previous: { score, category } | null }
 */
export async function recalculateStudentRisk(studentId) {
  if (!USE_MOCKS) return apiClient(`/risk/recalculate/${studentId}`, { method: 'POST' });

  await mockDelay(500);
  const before = mockRiskAssessments.get(studentId);
  const previous = before ? { score: before.score, category: before.category } : null;
  const assessment = recalculateMockRisk(studentId);
  if (!assessment) throw notFound();
  return { assessment: withStudent(assessment), previous };
}

/**
 * Recalculate every active student (school admin / principal).
 * POST /risk/recalculate → { processed, changed }
 */
export async function recalculateAllRisk() {
  if (!USE_MOCKS) return apiClient('/risk/recalculate', { method: 'POST' });

  await mockDelay(800);
  const before = new Map([...mockRiskAssessments].map(([id, a]) => [id, `${a.score}|${a.category}|${a.dataStatus}`]));
  const results = recalculateAllMockRisk();
  const changed = results.filter((a) => before.get(a.studentId) !== `${a.score}|${a.category}|${a.dataStatus}`).length;
  return { processed: results.length, changed };
}

/**
 * Record that a staff member reviewed this flag, with context.
 * POST /risk/:studentId/review  body { note }
 */
export async function markRiskReviewed(studentId, note) {
  if (!USE_MOCKS) {
    return apiClient(`/risk/${studentId}/review`, { method: 'POST', body: JSON.stringify({ note }) });
  }

  await mockDelay(350);
  if (!note || note.trim().length < 10) {
    throw new ApiError({
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Add a short review note (at least 10 characters).',
      details: [{ field: 'note', message: 'Add a short review note (at least 10 characters).' }],
    });
  }
  const assessment = mockRiskAssessments.get(studentId);
  if (!assessment) throw notFound();

  const user = getMockSessionUser();
  Object.assign(assessment, {
    reviewedAt: new Date().toISOString(),
    reviewedById: user?.id ?? null,
    reviewedByName: user?.name ?? 'Staff',
    reviewNote: note.trim(),
  });
  return withStudent(assessment);
}
