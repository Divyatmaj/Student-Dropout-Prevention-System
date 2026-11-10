/**
 * Daily attendance: one record per student per school day.
 *
 * - Anyone may record attendance for students in their scope.
 * - Corrections: school admins and principals any record; others only the
 *   records they entered (shared canCorrectAttendance).
 * - Deletion: school admins only, with a reason, written to the audit log.
 * - Every change recalculates the student's risk indicator.
 */
import { summarizeAttendance, canCorrectAttendance, ATTENDANCE_THRESHOLDS } from '@udaan/shared';

import { getPrisma } from '../config/prisma.js';
import { AppError, forbidden, notFound, validationError } from '../utils/AppError.js';
import { fromDbDate, toDbDate, schoolToday, addDays } from '../utils/dates.js';
import { studentScope, findStudentInScope } from './scope.js';
import { recalculateStudentRisk, recalculateMany } from './risk.service.js';

const DEFAULT_PERIOD_DAYS = 30;

const RECORD_INCLUDE = {
  recordedBy: { select: { name: true } },
  student: { select: { fullName: true, studentCode: true, grade: true, section: true } },
};

/** Attendance row → API shape (student fields included when loaded). */
export function toAttendanceRecord(r) {
  return {
    id: r.id,
    studentId: r.studentId,
    date: fromDbDate(r.date),
    status: r.status,
    note: r.note ?? '',
    recordedById: r.recordedById,
    recordedByName: r.recordedBy?.name ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    ...(r.student && {
      studentName: r.student.fullName,
      studentCode: r.student.studentCode,
      grade: r.student.grade,
      section: r.student.section,
    }),
  };
}

const cannotCorrect = (record) =>
  forbidden(
    `This entry was recorded by ${record.recordedBy?.name ?? 'another staff member'}. Only a school administrator, principal or the original recorder can correct it.`
  );

function assertNotFuture(date) {
  if (date > schoolToday()) throw validationError([{ field: 'date', message: 'Attendance cannot be recorded for a future date.' }]);
}

async function findRecordInScope(user, id) {
  const record = await getPrisma().attendance.findFirst({
    where: { id, schoolId: user.schoolId, student: studentScope(user) },
    include: RECORD_INCLUDE,
  });
  if (!record) throw notFound('Attendance record not found.', 'ATTENDANCE_NOT_FOUND');
  return record;
}

/**
 * GET /attendance/overview?from=&to=  (default: last 30 days)
 * Same shape as the web app's mock: school rate, latest day, class rates and
 * students needing attention.
 */
export async function getOverview(user, { from, to }) {
  const period = { from: from || addDays(schoolToday(), -DEFAULT_PERIOD_DAYS), to: to || schoolToday() };
  const db = getPrisma();
  const active = await db.student.findMany({
    where: studentScope(user, { status: 'ACTIVE' }),
    select: { id: true, fullName: true, studentCode: true, grade: true, section: true },
  });
  const ids = active.map((s) => s.id);
  const rows = await db.attendance.findMany({
    where: { studentId: { in: ids }, date: { gte: toDbDate(period.from), lte: toDbDate(period.to) } },
    select: { studentId: true, date: true, status: true },
  });
  const inPeriod = rows.map((r) => ({ ...r, date: fromDbDate(r.date) }));
  const byStudent = new Map(ids.map((id) => [id, []]));
  inPeriod.forEach((r) => byStudent.get(r.studentId).push(r));

  const perStudent = active.map((student) => ({ student, summary: summarizeAttendance(byStudent.get(student.id)) }));

  const classes = new Map();
  active.forEach((s) => {
    const key = `${s.grade}|${s.section ?? ''}`;
    if (!classes.has(key)) classes.set(key, { grade: s.grade, section: s.section, ids: [] });
    classes.get(key).ids.push(s.id);
  });
  const classRates = [...classes.values()]
    .map(({ grade, section, ids: classIds }) => ({
      grade,
      section,
      students: classIds.length,
      attendanceRate: summarizeAttendance(classIds.flatMap((id) => byStudent.get(id))).attendancePercentage,
    }))
    .sort((a, b) => Number(a.grade) - Number(b.grade) || (a.section || '').localeCompare(b.section || ''));

  const latestDate = inPeriod.reduce((max, r) => (r.date > max ? r.date : max), '');
  const latestDay = latestDate
    ? { date: latestDate, marked: new Set(inPeriod.filter((r) => r.date === latestDate).map((r) => r.studentId)).size, total: active.length }
    : null;

  const attention = perStudent
    .filter(({ summary }) => (summary.attendancePercentage !== null && summary.attendancePercentage < ATTENDANCE_THRESHOLDS.low) || summary.consecutiveAbsences >= 3)
    .map(({ student, summary }) => ({
      studentId: student.id,
      studentName: student.fullName,
      studentCode: student.studentCode,
      grade: student.grade,
      section: student.section,
      attendancePercentage: summary.attendancePercentage,
      consecutiveAbsences: summary.consecutiveAbsences,
    }))
    .sort((a, b) => b.consecutiveAbsences - a.consecutiveAbsences || (a.attendancePercentage ?? 100) - (b.attendancePercentage ?? 100));

  return {
    period,
    schoolSummary: summarizeAttendance(inPeriod),
    schoolAttendanceRate: summarizeAttendance(inPeriod).attendancePercentage,
    activeStudents: active.length,
    latestDay,
    studentsBelowThreshold: perStudent.filter(
      ({ summary }) => summary.attendancePercentage !== null && summary.attendancePercentage < ATTENDANCE_THRESHOLDS.low
    ).length,
    studentsWithAbsenceStreak: perStudent.filter(({ summary }) => summary.consecutiveAbsences >= 3).length,
    classRates,
    attention,
  };
}

/** GET /attendance?date=&from=&to=&grade=&section=&status=&search=&page=&limit= */
export async function listRecords(user, { date, from, to, grade, section, status, search, page, limit }) {
  const dateFilter = date
    ? { equals: toDbDate(date) }
    : from || to
      ? { ...(from && { gte: toDbDate(from) }), ...(to && { lte: toDbDate(to) }) }
      : undefined;
  const where = {
    schoolId: user.schoolId,
    ...(dateFilter && { date: dateFilter }),
    ...(status && { status }),
    student: studentScope(user, {
      ...(grade && { grade }),
      ...(section && { section }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { studentCode: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }),
  };
  const db = getPrisma();
  const [total, rows] = await Promise.all([
    db.attendance.count({ where }),
    db.attendance.findMany({
      where,
      include: RECORD_INCLUDE,
      orderBy: [{ date: 'desc' }, { student: { fullName: 'asc' } }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return { records: rows.map(toAttendanceRecord), total, page, limit };
}

/** GET /attendance/register?date=&grade=&section= — every active student in the class with that day's record. */
export async function getRegister(user, { date, grade, section }) {
  const students = await getPrisma().student.findMany({
    where: studentScope(user, { status: 'ACTIVE', grade, ...(section && { section }) }),
    select: {
      id: true,
      fullName: true,
      studentCode: true,
      grade: true,
      section: true,
      attendance: { where: { date: toDbDate(date) }, include: { recordedBy: { select: { name: true } } } },
    },
    orderBy: { fullName: 'asc' },
  });
  return {
    date,
    students: students.map(({ attendance, ...student }) => ({
      student,
      record: attendance[0] ? toAttendanceRecord(attendance[0]) : null,
    })),
  };
}

/** POST /attendance — one entry; 409 if the student already has one for that date. */
export async function recordAttendance(user, { studentId, date, status, note }) {
  assertNotFuture(date);
  const student = await findStudentInScope(user, studentId, { select: { id: true, fullName: true, status: true } });
  if (student.status !== 'ACTIVE') {
    throw validationError([{ field: 'studentId', message: `${student.fullName} is not an active student.` }]);
  }
  const db = getPrisma();
  const existing = await db.attendance.findUnique({ where: { studentId_date: { studentId, date: toDbDate(date) } }, select: { id: true } });
  if (existing) {
    throw new AppError({
      status: 409,
      code: 'DUPLICATE_ATTENDANCE',
      message: `Attendance for ${student.fullName} on ${date} has already been recorded.`,
    });
  }
  const record = await db.attendance.create({
    data: { schoolId: user.schoolId, studentId, date: toDbDate(date), status, note: note || null, recordedById: user.id },
    include: RECORD_INCLUDE,
  });
  await recalculateStudentRisk(studentId);
  return toAttendanceRecord(record);
}

/**
 * POST /attendance/bulk — save a class register. Creates missing records and
 * updates changed ones, all or nothing.
 */
export async function saveRegister(user, { date, entries }) {
  assertNotFuture(date);
  const db = getPrisma();
  const ids = entries.map((e) => e.studentId);
  if (new Set(ids).size !== ids.length) {
    throw validationError([{ field: 'entries', message: 'Each student can appear only once.' }]);
  }

  const students = await db.student.findMany({
    where: studentScope(user, { id: { in: ids } }),
    select: { id: true, fullName: true, status: true },
  });
  const byId = new Map(students.map((s) => [s.id, s]));
  const details = [];
  entries.forEach((e, i) => {
    const s = byId.get(e.studentId);
    if (!s) details.push({ field: `entries.${i}.studentId`, message: 'Student not found.' });
    else if (s.status !== 'ACTIVE') details.push({ field: `entries.${i}.studentId`, message: `${s.fullName} is not an active student.` });
  });
  if (details.length) throw validationError(details, 'Some students cannot be marked.');

  const existing = await db.attendance.findMany({
    where: { studentId: { in: ids }, date: toDbDate(date) },
    include: { recordedBy: { select: { name: true } } },
  });
  const existingByStudent = new Map(existing.map((r) => [r.studentId, r]));

  const toCreate = [];
  const toUpdate = [];
  for (const e of entries) {
    const note = e.note || null;
    const current = existingByStudent.get(e.studentId);
    if (!current) toCreate.push({ ...e, note });
    else if (current.status !== e.status || (current.note || null) !== note) {
      if (!canCorrectAttendance(user, current)) throw cannotCorrect(current);
      toUpdate.push({ id: current.id, status: e.status, note });
    }
  }

  await db.$transaction([
    ...toCreate.map((e) =>
      db.attendance.create({
        data: { schoolId: user.schoolId, studentId: e.studentId, date: toDbDate(date), status: e.status, note: e.note, recordedById: user.id },
      })
    ),
    ...toUpdate.map((u) => db.attendance.update({ where: { id: u.id }, data: { status: u.status, note: u.note } })),
  ]);
  await recalculateMany(ids);

  const records = await db.attendance.findMany({
    where: { studentId: { in: ids }, date: toDbDate(date) },
    include: RECORD_INCLUDE,
    orderBy: { student: { fullName: 'asc' } },
  });
  return { created: toCreate.length, updated: toUpdate.length, records: records.map(toAttendanceRecord) };
}

/** PATCH /attendance/:id — correct status or note. */
export async function updateRecord(user, id, { status, note }) {
  const record = await findRecordInScope(user, id);
  if (!canCorrectAttendance(user, record)) throw cannotCorrect(record);
  const updated = await getPrisma().attendance.update({
    where: { id },
    data: { ...(status !== undefined && { status }), ...(note !== undefined && { note: note || null }) },
    include: RECORD_INCLUDE,
  });
  await recalculateStudentRisk(record.studentId);
  return toAttendanceRecord(updated);
}

/** DELETE /attendance/:id { reason } — school admin only; the removed record is kept in the audit log. */
export async function deleteRecord(user, id, reason) {
  const record = await findRecordInScope(user, id);
  const db = getPrisma();
  await db.$transaction([
    db.auditLog.create({
      data: {
        schoolId: user.schoolId,
        actorId: user.id,
        action: 'ATTENDANCE_DELETED',
        entityType: 'Attendance',
        entityId: record.id,
        reason,
        details: { ...toAttendanceRecord(record), recordedByName: record.recordedBy?.name ?? null },
      },
    }),
    db.attendance.delete({ where: { id } }),
  ]);
  await recalculateStudentRisk(record.studentId);
  return null;
}

/** GET /attendance/student/:studentId?from=&to= → { summary, records } */
export async function getStudentAttendance(user, studentId, { from, to }) {
  await findStudentInScope(user, studentId, { select: { id: true } });
  const rows = await getPrisma().attendance.findMany({
    where: {
      studentId,
      ...((from || to) && { date: { ...(from && { gte: toDbDate(from) }), ...(to && { lte: toDbDate(to) }) } }),
    },
    include: { recordedBy: { select: { name: true } } },
    orderBy: { date: 'desc' },
  });
  const records = rows.map(toAttendanceRecord);
  return { summary: summarizeAttendance(records), records };
}
