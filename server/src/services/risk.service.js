/**
 * Keeps each active student's current RiskAssessment in step with their
 * records. Called after any change to attendance, marks, the
 * financial-barrier flag, enrolment status or interventions.
 * The scoring itself is @udaan/shared assessStudentRisk — the same code the
 * web app's mock mode and the tests use.
 */
import { assessStudentRisk } from '@udaan/shared';

import { getPrisma } from '../config/prisma.js';
import { schoolToday } from '../utils/dates.js';

/**
 * Recalculate one student. Removes the assessment for students who are no
 * longer active. Returns { assessment, previous } (assessment null if inactive).
 * @param db  Prisma client or transaction client
 */
export async function recalculateStudentRisk(studentId, { db = getPrisma(), now = new Date() } = {}) {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      schoolId: true,
      status: true,
      financialBarrierReported: true,
      riskAssessment: true,
      attendance: { select: { date: true, status: true } },
      marks: { select: { score: true, assessment: { select: { subject: true, assessmentDate: true, maxMarks: true } } } },
      interventions: { select: { status: true, dueDate: true } },
    },
  });
  if (!student) return { assessment: null, previous: null };

  const previous = student.riskAssessment;
  if (student.status !== 'ACTIVE') {
    if (previous) await db.riskAssessment.delete({ where: { studentId } });
    return { assessment: null, previous };
  }

  const result = assessStudentRisk({
    attendance: student.attendance,
    marks: student.marks.map((m) => ({ score: m.score, ...m.assessment })),
    financialBarrierReported: student.financialBarrierReported,
    interventions: student.interventions,
    today: schoolToday(now),
  });

  const changed =
    !previous ||
    previous.score !== result.score ||
    previous.category !== result.category ||
    previous.dataStatus !== result.dataStatus;

  const data = {
    score: result.score,
    category: result.category,
    dataStatus: result.dataStatus,
    reasons: result.reasons,
    dataGaps: result.dataGaps,
    indicators: result.indicators,
    humanReviewRequired: result.humanReviewRequired,
    calculatedAt: now,
    ...(changed && { changedAt: now }),
  };

  const assessment = await db.riskAssessment.upsert({
    where: { studentId },
    update: data,
    create: { ...data, studentId, schoolId: student.schoolId, changedAt: now },
  });
  return { assessment, previous };
}

/** Recalculate several students one after another. */
export async function recalculateMany(studentIds, options) {
  const results = [];
  for (const id of new Set(studentIds)) results.push(await recalculateStudentRisk(id, options));
  return results;
}
