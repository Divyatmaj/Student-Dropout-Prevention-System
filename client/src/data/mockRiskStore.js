/**
 * Mock "current risk assessment" store (VITE_USE_MOCKS=true only).
 *
 * Mirrors the API's RiskAssessment table: one row per active student holding
 * the latest score, category, data status, reasons and review state. Mock
 * services call `recalculateMockRisk` after any change to attendance, marks,
 * support flags or enrolment status — the same moments the API recalculates.
 */
import { assessStudentRisk } from '@udaan/shared';

import { mockStudentsList } from './mockStudentsData.js';
import { mockAttendanceRecords } from './mockAttendanceData.js';
import { mockMarksForStudent } from './mockAcademicsData.js';
import { mockInterventionsList } from './mockInterventionsData.js';
import { todayISO } from '../utils/formatters.js';

const SEEDED_AT = '2026-11-06T16:30:00.000Z';

function interventionsFor(studentId) {
  return mockInterventionsList.filter((i) => i.studentId === studentId);
}

/** studentId → current risk assessment */
export const mockRiskAssessments = new Map();

/**
 * Recalculate (or remove, for inactive students) one student's assessment.
 * @returns the new assessment, or null if the student isn't active.
 */
export function recalculateMockRisk(studentId, calculatedAt = new Date().toISOString()) {
  const student = mockStudentsList.find((s) => s.id === studentId);
  if (!student || student.status !== 'ACTIVE') {
    mockRiskAssessments.delete(studentId);
    return null;
  }

  const result = assessStudentRisk({
    attendance: mockAttendanceRecords.filter((r) => r.studentId === studentId),
    marks: mockMarksForStudent(studentId),
    financialBarrierReported: student.financialBarrierReported,
    interventions: interventionsFor(studentId),
    today: todayISO(),
  });

  const previous = mockRiskAssessments.get(studentId);
  const changed =
    !previous ||
    previous.score !== result.score ||
    previous.category !== result.category ||
    previous.dataStatus !== result.dataStatus;

  const assessment = {
    studentId,
    ...result,
    calculatedAt,
    changedAt: changed ? calculatedAt : previous.changedAt,
    reviewedAt: previous?.reviewedAt ?? null,
    reviewedById: previous?.reviewedById ?? null,
    reviewedByName: previous?.reviewedByName ?? null,
    reviewNote: previous?.reviewNote ?? null,
  };
  mockRiskAssessments.set(studentId, assessment);
  return assessment;
}

export function recalculateAllMockRisk(calculatedAt = new Date().toISOString()) {
  return mockStudentsList.map((s) => recalculateMockRisk(s.id, calculatedAt)).filter(Boolean);
}

/** Has the score changed since the last human review? */
export function needsReview(assessment) {
  if (!assessment || assessment.category === 'LOW') return false;
  return !assessment.reviewedAt || assessment.reviewedAt < assessment.changedAt;
}

// Seed every active student, then one example review.
recalculateAllMockRisk(SEEDED_AT);
const vikram = mockRiskAssessments.get('STU-1205');
if (vikram) {
  Object.assign(vikram, {
    reviewedAt: '2026-11-07T09:15:00.000Z',
    reviewedById: 'USR-002',
    reviewedByName: 'Amit Verma',
    reviewNote: 'Spoke with father. Agreed Vikram will not work at the shop on school mornings; class teacher to check in weekly.',
  });
}
