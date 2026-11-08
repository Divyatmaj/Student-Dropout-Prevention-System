/**
 * Assessments and marks.
 *
 * - An assessment belongs to a class (grade + section) or a whole grade.
 * - One mark per student per assessment; scores are checked against the
 *   assessment's maximum. A blank score is "not recorded", never zero.
 * - Teachers work with the classes of their assigned students and only
 *   enter marks for those students.
 * - Every mark change recalculates the student's risk indicator.
 */
import {
  toPercentage,
  validateScore,
  averagePercentage,
  calculateAcademicDecline,
  ACADEMIC_DECLINE_THRESHOLDS,
  can,
  PERMISSIONS,
} from '@udaan/shared';

import { getPrisma } from '../config/prisma.js';
import { AppError, forbidden, notFound, validationError } from '../utils/AppError.js';
import { fromDbDate, toDbDate, schoolToday } from '../utils/dates.js';
import { studentScope, assessmentScope, isTeacher, teacherClasses } from './scope.js';
import { recalculateStudentRisk, recalculateMany } from './risk.service.js';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function toAssessment(a) {
  return {
    id: a.id,
    title: a.title,
    subject: a.subject,
    grade: a.grade,
    section: a.section,
    assessmentDate: fromDbDate(a.assessmentDate),
    maxMarks: a.maxMarks,
    createdById: a.createdById,
    createdByName: a.createdBy?.name ?? null,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

function toMark(m, maxMarks) {
  return {
    id: m.id,
    studentId: m.studentId,
    assessmentId: m.assessmentId,
    score: m.score,
    recordedById: m.recordedById,
    recordedByName: m.recordedBy?.name ?? null,
    percentage: toPercentage(m.score, maxMarks),
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

/** Is this student part of the assessment's class on the assessment date? */
function inClass(student, assessment) {
  return (
    student.grade === assessment.grade &&
    (!assessment.section || student.section === assessment.section) &&
    (!student.admissionDate || student.admissionDate <= assessment.assessmentDate)
  );
}

/**
 * Add marksCount, classSize, missingMarks and averagePercentage to each
 * assessment, counting only students the user can see.
 */
async function withStats(user, assessments) {
  if (assessments.length === 0) return [];
  const db = getPrisma();
  const grades = [...new Set(assessments.map((a) => a.grade))];
  const [students, marks] = await Promise.all([
    db.student.findMany({
      where: studentScope(user, { grade: { in: grades } }),
      select: { id: true, grade: true, section: true, admissionDate: true, status: true },
    }),
    db.studentMark.findMany({
      where: { assessmentId: { in: assessments.map((a) => a.id) }, student: studentScope(user) },
      select: { assessmentId: true, studentId: true, score: true },
    }),
  ]);
  const marksByAssessment = new Map();
  marks.forEach((m) => {
    const list = marksByAssessment.get(m.assessmentId) || [];
    list.push(m);
    marksByAssessment.set(m.assessmentId, list);
  });

  return assessments.map((a) => {
    const list = marksByAssessment.get(a.id) || [];
    const marked = new Set(list.map((m) => m.studentId));
    const activeInClass = students.filter((s) => s.status === 'ACTIVE' && inClass(s, a));
    return {
      ...toAssessment(a),
      marksCount: list.length,
      classSize: activeInClass.length,
      missingMarks: activeInClass.filter((s) => !marked.has(s.id)).length,
      averagePercentage: averagePercentage(list.map((m) => ({ score: m.score, maxMarks: a.maxMarks }))),
    };
  });
}

async function findAssessmentInScope(user, id) {
  const assessment = await getPrisma().assessment.findFirst({
    where: await assessmentScope(user, { id }),
    include: { createdBy: { select: { name: true } } },
  });
  if (!assessment) throw notFound('Assessment not found.', 'ASSESSMENT_NOT_FOUND');
  return assessment;
}

/** Teachers may only create assessments for their students' classes. */
async function assertTeacherTeachesClass(user, grade, section) {
  if (!isTeacher(user)) return;
  const classes = await teacherClasses(user);
  const ok = classes.some((c) => c.grade === grade && (!section || c.section === section));
  if (!ok) {
    throw validationError([{ field: 'grade', message: 'You can only create assessments for classes with students assigned to you.' }]);
  }
}

function assertNotFuture(date) {
  if (date > schoolToday()) throw validationError([{ field: 'assessmentDate', message: 'The date cannot be in the future.' }]);
}

/* -------------------------------------------------------------------------- */
/* Assessments                                                                */
/* -------------------------------------------------------------------------- */

/** GET /assessments/overview */
export async function getOverview(user) {
  const db = getPrisma();
  const assessments = await db.assessment.findMany({ where: await assessmentScope(user) });
  const stats = await withStats(user, assessments);

  const students = await db.student.findMany({
    where: studentScope(user, { status: 'ACTIVE' }),
    select: {
      id: true,
      fullName: true,
      studentCode: true,
      grade: true,
      section: true,
      marks: { select: { score: true, assessment: { select: { subject: true, assessmentDate: true, maxMarks: true } } } },
    },
  });

  const declining = students
    .map((s) => ({ s, decline: calculateAcademicDecline(s.marks.map((m) => ({ score: m.score, ...m.assessment }))) }))
    .filter(({ decline }) => decline && decline.drop >= ACADEMIC_DECLINE_THRESHOLDS.moderate)
    .map(({ s, decline }) => ({
      studentId: s.id,
      studentName: s.fullName,
      studentCode: s.studentCode,
      grade: s.grade,
      section: s.section,
      ...decline,
    }))
    .sort((a, b) => b.drop - a.drop);

  const allMarks = students.flatMap((s) => s.marks.map((m) => ({ score: m.score, maxMarks: m.assessment.maxMarks })));
  return {
    assessmentsCount: assessments.length,
    marksCount: stats.reduce((sum, a) => sum + a.marksCount, 0),
    averagePercentage: averagePercentage(allMarks),
    pendingAssessments: stats.filter((a) => a.missingMarks > 0).length,
    declining,
  };
}

/** GET /assessments?search=&grade=&section=&subject= */
export async function listAssessments(user, { search, grade, section, subject }) {
  const where = await assessmentScope(user, {
    ...(grade && { grade }),
    ...(section && { section }),
    ...(subject && { subject }),
    ...(search && {
      AND: [{ OR: [{ title: { contains: search, mode: 'insensitive' } }, { subject: { contains: search, mode: 'insensitive' } }] }],
    }),
  });
  const rows = await getPrisma().assessment.findMany({
    where,
    include: { createdBy: { select: { name: true } } },
    orderBy: [{ assessmentDate: 'desc' }, { grade: 'asc' }, { section: 'asc' }, { subject: 'asc' }],
  });
  const assessments = (await withStats(user, rows)).sort(
    (a, b) =>
      b.assessmentDate.localeCompare(a.assessmentDate) ||
      Number(a.grade) - Number(b.grade) ||
      (a.section || '').localeCompare(b.section || '') ||
      a.subject.localeCompare(b.subject)
  );
  return { assessments, total: assessments.length };
}

/** POST /assessments */
export async function createAssessment(user, values) {
  assertNotFuture(values.assessmentDate);
  await assertTeacherTeachesClass(user, values.grade, values.section);
  const created = await getPrisma().assessment.create({
    data: {
      ...values,
      section: values.section ?? null,
      assessmentDate: toDbDate(values.assessmentDate),
      schoolId: user.schoolId,
      createdById: user.id,
    },
    include: { createdBy: { select: { name: true } } },
  });
  return (await withStats(user, [created]))[0];
}

/**
 * GET /assessments/:id — the marks sheet: every student in the class on the
 * assessment date (active, or with a mark already), with their mark or null.
 */
export async function getAssessment(user, id) {
  const assessment = await findAssessmentInScope(user, id);
  const db = getPrisma();
  const students = await db.student.findMany({
    where: studentScope(user, { grade: assessment.grade, ...(assessment.section && { section: assessment.section }) }),
    select: {
      id: true,
      fullName: true,
      studentCode: true,
      status: true,
      grade: true,
      section: true,
      admissionDate: true,
      marks: { where: { assessmentId: id }, include: { recordedBy: { select: { name: true } } } },
    },
    orderBy: { fullName: 'asc' },
  });

  const rows = students
    .filter((s) => inClass(s, assessment) && (s.status === 'ACTIVE' || s.marks.length > 0))
    .map((s) => ({
      student: { id: s.id, fullName: s.fullName, studentCode: s.studentCode, status: s.status },
      mark: s.marks[0] ? toMark(s.marks[0], assessment.maxMarks) : null,
    }));

  return { assessment: (await withStats(user, [assessment]))[0], students: rows };
}

/** PATCH /assessments/:id — creator or school admin. Grade/section are fixed once marks exist. */
export async function updateAssessment(user, id, values) {
  const assessment = await findAssessmentInScope(user, id);
  if (assessment.createdById !== user.id && !can(user, PERMISSIONS.ASSESSMENT_UPDATE_ANY)) {
    throw forbidden('Only the person who created this assessment or a school administrator can change it.');
  }
  const db = getPrisma();
  const marks = await db.studentMark.findMany({ where: { assessmentId: id }, select: { score: true } });
  const details = [];
  if (marks.length && (('grade' in values && values.grade !== assessment.grade) || ('section' in values && (values.section ?? null) !== assessment.section))) {
    details.push({ field: 'grade', message: 'The class cannot change after marks have been entered.' });
  }
  if (values.maxMarks !== undefined && marks.some((m) => m.score > values.maxMarks)) {
    details.push({ field: 'maxMarks', message: 'Some recorded scores are higher than this maximum.' });
  }
  if (values.assessmentDate) assertNotFuture(values.assessmentDate);
  if (details.length) throw validationError(details);

  const updated = await db.assessment.update({
    where: { id },
    data: { ...values, ...(values.assessmentDate && { assessmentDate: toDbDate(values.assessmentDate) }) },
    include: { createdBy: { select: { name: true } } },
  });
  const affected = await db.studentMark.findMany({ where: { assessmentId: id }, select: { studentId: true } });
  if (values.maxMarks !== undefined || values.assessmentDate || values.subject) {
    await recalculateMany(affected.map((m) => m.studentId));
  }
  return (await withStats(user, [updated]))[0];
}

/** DELETE /assessments/:id — school admin, only while no marks are recorded. */
export async function deleteAssessment(user, id) {
  await findAssessmentInScope(user, id);
  const db = getPrisma();
  const count = await db.studentMark.count({ where: { assessmentId: id } });
  if (count > 0) {
    throw new AppError({
      status: 409,
      code: 'ASSESSMENT_HAS_MARKS',
      message: `This assessment has ${count} recorded mark${count === 1 ? '' : 's'}. Remove them first, or keep the assessment.`,
    });
  }
  await db.assessment.delete({ where: { id } });
  return null;
}

/* -------------------------------------------------------------------------- */
/* Marks                                                                      */
/* -------------------------------------------------------------------------- */

async function studentsForMarks(user, assessment, studentIds) {
  const students = await getPrisma().student.findMany({
    where: studentScope(user, { id: { in: studentIds } }),
    select: { id: true, fullName: true, grade: true, section: true, admissionDate: true },
  });
  return new Map(students.map((s) => [s.id, s]));
}

function markDetails(entries, assessment, students, fieldPrefix = (i) => `score.${entries[i].studentId}`) {
  const details = [];
  entries.forEach((e, i) => {
    const s = students.get(e.studentId);
    if (!s) details.push({ field: fieldPrefix(i), message: 'Student not found.' });
    else if (!inClass(s, assessment)) details.push({ field: fieldPrefix(i), message: `${s.fullName} is not in this assessment's class.` });
    const msg = validateScore(e.score, assessment.maxMarks);
    if (msg) details.push({ field: fieldPrefix(i), message: msg });
  });
  return details;
}

/** POST /marks/bulk { assessmentId, entries: [{ studentId, score }] } → { created, updated } (all or nothing) */
export async function saveMarks(user, { assessmentId, entries }) {
  const assessment = await findAssessmentInScope(user, assessmentId);
  const ids = entries.map((e) => e.studentId);
  if (new Set(ids).size !== ids.length) throw validationError([{ field: 'entries', message: 'Each student can appear only once.' }]);

  const students = await studentsForMarks(user, assessment, ids);
  const details = markDetails(entries, assessment, students);
  if (details.length) throw validationError(details, 'Some scores are not valid.');

  const db = getPrisma();
  const existing = await db.studentMark.findMany({ where: { assessmentId, studentId: { in: ids } } });
  const byStudent = new Map(existing.map((m) => [m.studentId, m]));
  const toCreate = entries.filter((e) => !byStudent.has(e.studentId));
  const toUpdate = entries.filter((e) => byStudent.has(e.studentId) && byStudent.get(e.studentId).score !== Number(e.score));

  await db.$transaction([
    ...toCreate.map((e) =>
      db.studentMark.create({
        data: { schoolId: user.schoolId, assessmentId, studentId: e.studentId, score: Number(e.score), recordedById: user.id },
      })
    ),
    ...toUpdate.map((e) => db.studentMark.update({ where: { id: byStudent.get(e.studentId).id }, data: { score: Number(e.score) } })),
  ]);
  await recalculateMany([...toCreate, ...toUpdate].map((e) => e.studentId));
  return { created: toCreate.length, updated: toUpdate.length };
}

/** POST /marks { studentId, assessmentId, score } — 409 if already recorded. */
export async function recordMark(user, { studentId, assessmentId, score }) {
  const assessment = await findAssessmentInScope(user, assessmentId);
  const students = await studentsForMarks(user, assessment, [studentId]);
  const details = markDetails([{ studentId, score }], assessment, students, () => 'score');
  if (details.length) throw validationError(details);

  const db = getPrisma();
  const existing = await db.studentMark.findUnique({ where: { studentId_assessmentId: { studentId, assessmentId } }, select: { id: true } });
  if (existing) {
    throw new AppError({ status: 409, code: 'DUPLICATE_MARK', message: 'A mark for this student and assessment already exists. Correct it instead.' });
  }
  const mark = await db.studentMark.create({
    data: { schoolId: user.schoolId, studentId, assessmentId, score: Number(score), recordedById: user.id },
    include: { recordedBy: { select: { name: true } } },
  });
  await recalculateStudentRisk(studentId);
  return toMark(mark, assessment.maxMarks);
}

async function findMarkInScope(user, id) {
  const mark = await getPrisma().studentMark.findFirst({
    where: { id, schoolId: user.schoolId, student: studentScope(user) },
    include: { assessment: true, recordedBy: { select: { name: true } } },
  });
  if (!mark) throw notFound('Mark not found.', 'MARK_NOT_FOUND');
  return mark;
}

/** PATCH /marks/:id { score } */
export async function updateMark(user, id, { score }) {
  const mark = await findMarkInScope(user, id);
  const msg = validateScore(score, mark.assessment.maxMarks);
  if (msg) throw validationError([{ field: 'score', message: msg }]);
  const updated = await getPrisma().studentMark.update({
    where: { id },
    data: { score: Number(score) },
    include: { recordedBy: { select: { name: true } } },
  });
  await recalculateStudentRisk(mark.studentId);
  return toMark(updated, mark.assessment.maxMarks);
}

/** DELETE /marks/:id { reason } — school admin; the removed mark is kept in the audit log. */
export async function deleteMark(user, id, reason) {
  const mark = await findMarkInScope(user, id);
  const db = getPrisma();
  await db.$transaction([
    db.auditLog.create({
      data: {
        schoolId: user.schoolId,
        actorId: user.id,
        action: 'MARK_DELETED',
        entityType: 'StudentMark',
        entityId: mark.id,
        reason,
        details: { ...toMark(mark, mark.assessment.maxMarks), assessmentTitle: mark.assessment.title, subject: mark.assessment.subject },
      },
    }),
    db.studentMark.delete({ where: { id } }),
  ]);
  await recalculateStudentRisk(mark.studentId);
  return null;
}

