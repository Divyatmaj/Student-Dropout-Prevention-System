/**
 * Keeps each active student's current RiskAssessment in step with their
 * records. Called after any change to attendance, marks, the
 * financial-barrier flag, enrolment status or interventions.
 * The scoring itself is @udaan/shared assessStudentRisk — the same code the
 * web app's mock mode and the tests use.
 */
import { assessStudentRisk, needsReview } from '@udaan/shared';

import { getPrisma } from '../config/prisma.js';
import { notFound } from '../utils/AppError.js';
import { schoolToday } from '../utils/dates.js';
import { studentScope, findStudentInScope } from './scope.js';
import { toRiskAssessment } from './serializers.js';

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

/* -------------------------------------------------------------------------- */
/* Risk API (GET /risk…, POST /risk/recalculate…, POST /risk/:id/review)      */
/* -------------------------------------------------------------------------- */

const CATEGORY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2, INSUFFICIENT_DATA: 3 };

/**
 * Scores depend on the date (an open intervention becomes overdue at
 * midnight), so before risk is read, recalculate any active student whose
 * assessment was last calculated before today's school date — or who has
 * none yet. Cheap after the first read of the day.
 */
export async function refreshStaleRisk(schoolId, { db = getPrisma(), now = new Date() } = {}) {
  const today = schoolToday(now);
  const students = await db.student.findMany({
    where: { schoolId, status: 'ACTIVE' },
    select: { id: true, riskAssessment: { select: { calculatedAt: true } } },
  });
  const stale = students
    .filter((s) => !s.riskAssessment || schoolToday(s.riskAssessment.calculatedAt) < today)
    .map((s) => s.id);
  if (stale.length) await recalculateMany(stale, { db, now });
  return stale.length;
}

const STUDENT_SELECT = { id: true, fullName: true, studentCode: true, grade: true, section: true };

function present(row) {
  return { ...toRiskAssessment(row), needsReview: needsReview(row), student: row.student ?? null };
}

const riskNotFound = () =>
  notFound('No risk assessment for this student. Only active students are assessed.', 'RISK_NOT_FOUND');

/** GET /risk/overview → { counts, provisional, awaitingReview, lastCalculatedAt } */
export async function getOverview(user) {
  await refreshStaleRisk(user.schoolId);
  const rows = await getPrisma().riskAssessment.findMany({
    where: { schoolId: user.schoolId, student: studentScope(user, { status: 'ACTIVE' }) },
    select: { category: true, dataStatus: true, reviewedAt: true, changedAt: true, calculatedAt: true },
  });
  const counts = { HIGH: 0, MEDIUM: 0, LOW: 0, INSUFFICIENT_DATA: 0 };
  rows.forEach((r) => {
    counts[r.category] += 1;
  });
  const last = rows.reduce((max, r) => (!max || r.calculatedAt > max ? r.calculatedAt : max), null);
  return {
    counts,
    provisional: rows.filter((r) => r.dataStatus === 'PROVISIONAL').length,
    awaitingReview: rows.filter(needsReview).length,
    lastCalculatedAt: last,
  };
}

/** GET /risk?category=&dataStatus=&grade=&section=&review=needs|reviewed&search= */
export async function listRisk(user, { category, dataStatus, grade, section, review, search }) {
  await refreshStaleRisk(user.schoolId);
  const rows = await getPrisma().riskAssessment.findMany({
    where: {
      schoolId: user.schoolId,
      ...(category && { category }),
      ...(dataStatus && { dataStatus }),
      student: studentScope(user, {
        status: 'ACTIVE',
        ...(grade && { grade }),
        ...(section && { section }),
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { studentCode: { contains: search, mode: 'insensitive' } },
          ],
        }),
      }),
    },
    include: { student: { select: STUDENT_SELECT }, reviewedBy: { select: { name: true } } },
  });
  const assessments = rows
    .map(present)
    .filter((a) => !review || (review === 'needs' ? a.needsReview : !a.needsReview && a.reviewedAt))
    .sort(
      (a, b) =>
        CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category] ||
        b.score - a.score ||
        a.student.fullName.localeCompare(b.student.fullName)
    );
  return { assessments, total: assessments.length };
}

async function loadPresented(studentId, db = getPrisma()) {
  const row = await db.riskAssessment.findUnique({
    where: { studentId },
    include: { student: { select: STUDENT_SELECT }, reviewedBy: { select: { name: true } } },
  });
  if (!row) throw riskNotFound();
  return present(row);
}

/** GET /risk/:studentId */
export async function getStudentRisk(user, studentId) {
  const student = await findStudentInScope(user, studentId, { select: { id: true, riskAssessment: { select: { calculatedAt: true } } } });
  if (student.riskAssessment && schoolToday(student.riskAssessment.calculatedAt) < schoolToday()) {
    await recalculateStudentRisk(studentId);
  }
  return loadPresented(studentId);
}

/** POST /risk/recalculate/:studentId → { assessment, previous: { score, category } | null } */
export async function recalculateOne(user, studentId) {
  await findStudentInScope(user, studentId, { select: { id: true } });
  const { assessment, previous } = await recalculateStudentRisk(studentId);
  if (!assessment) throw riskNotFound();
  return {
    assessment: await loadPresented(studentId),
    previous: previous ? { score: previous.score, category: previous.category } : null,
  };
}

/** POST /risk/recalculate (school admin, principal) → { processed, changed } */
export async function recalculateAll(user) {
  const db = getPrisma();
  const students = await db.student.findMany({ where: { schoolId: user.schoolId, status: 'ACTIVE' }, select: { id: true } });
  const results = await recalculateMany(students.map((s) => s.id));
  const key = (a) => (a ? `${a.score}|${a.category}|${a.dataStatus}` : null);
  return {
    processed: results.filter((r) => r.assessment).length,
    changed: results.filter((r) => r.assessment && key(r.assessment) !== key(r.previous)).length,
  };
}

/** POST /risk/:studentId/review { note } — a person looked at this flag. */
export async function markReviewed(user, studentId, note) {
  await findStudentInScope(user, studentId, { select: { id: true } });
  const db = getPrisma();
  const existing = await db.riskAssessment.findUnique({ where: { studentId }, select: { id: true } });
  if (!existing) throw riskNotFound();
  await db.riskAssessment.update({
    where: { studentId },
    data: { reviewedAt: new Date(), reviewedById: user.id, reviewNote: note },
  });
  return loadPresented(studentId);
}
