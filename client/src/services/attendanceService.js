import { summarizeAttendance, ATTENDANCE_STATUSES, ATTENDANCE_THRESHOLDS } from '@udaan/shared';

import { apiClient, ApiError, USE_MOCKS, mockDelay, buildQuery } from './api.js';
import { getMockSessionUser } from './authService.js';
import { mockAttendanceRecords, nextMockAttendanceId } from '../data/mockAttendanceData.js';
import { mockStudentsList } from '../data/mockStudentsData.js';
import { recalculateMockRisk } from '../data/mockRiskStore.js';
import { STUDENT_STATUS } from '../constants/students.js';
import { todayISO } from '../utils/formatters.js';

export const ATTENDANCE_PAGE_SIZE = 50;
const DEFAULT_PERIOD_DAYS = 30;

/* -------------------------------------------------------------------------- */
/* Mock helpers                                                               */
/* -------------------------------------------------------------------------- */

function daysAgoISO(days) {
  const date = new Date(`${todayISO()}T00:00:00`);
  date.setDate(date.getDate() - days);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function validationError(message, field) {
  return new ApiError({
    status: 422,
    code: 'VALIDATION_ERROR',
    message,
    details: field ? [{ field, message }] : [],
  });
}

function validateEntry({ studentId, date, status }) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw validationError('A valid date is required.', 'date');
  if (date > todayISO()) throw validationError('Attendance cannot be recorded for a future date.', 'date');
  if (!ATTENDANCE_STATUSES.includes(status)) throw validationError('Choose Present, Absent, Late or Excused.', 'status');

  const student = mockStudentsList.find((s) => s.id === studentId);
  if (!student) {
    throw new ApiError({ status: 404, code: 'STUDENT_NOT_FOUND', message: 'Student not found.' });
  }
  if (student.status !== STUDENT_STATUS.ACTIVE) {
    throw validationError(`${student.fullName} is not an active student.`, 'studentId');
  }
  return student;
}

function currentRecorder() {
  const user = getMockSessionUser();
  return { recordedById: user?.id ?? null, recordedByName: user?.name ?? 'Staff' };
}

/** Attach the student fields list views need. */
function withStudent(record) {
  const s = mockStudentsList.find((st) => st.id === record.studentId);
  return {
    ...record,
    studentName: s?.fullName ?? 'Unknown student',
    studentCode: s?.studentCode ?? '',
    grade: s?.grade ?? null,
    section: s?.section ?? null,
  };
}

function findRecord(id) {
  const record = mockAttendanceRecords.find((r) => r.id === id);
  if (!record) {
    throw new ApiError({ status: 404, code: 'ATTENDANCE_NOT_FOUND', message: 'Attendance record not found.' });
  }
  return record;
}

/** Records for one student, optionally limited to a date range. */
export function mockRecordsForStudent(studentId, { from, to } = {}) {
  return mockAttendanceRecords.filter(
    (r) => r.studentId === studentId && (!from || r.date >= from) && (!to || r.date <= to)
  );
}

/* -------------------------------------------------------------------------- */
/* Service functions                                                          */
/* -------------------------------------------------------------------------- */

/**
 * School attendance overview for a period (default: last 30 days).
 * GET /attendance/overview?from=&to=
 * → {
 *     period: { from, to },
 *     schoolAttendanceRate, activeStudents,
 *     latestDay: { date, marked, total } | null,
 *     studentsBelowThreshold, studentsWithAbsenceStreak,
 *     classRates: [{ grade, section, attendanceRate, students }],
 *     attention: [{ studentId, studentName, studentCode, grade, section,
 *                   attendancePercentage, consecutiveAbsences }]
 *   }
 */
export async function getAttendanceOverview({ from, to } = {}) {
  const period = { from: from || daysAgoISO(DEFAULT_PERIOD_DAYS), to: to || todayISO() };
  if (!USE_MOCKS) return apiClient(`/attendance/overview${buildQuery(period)}`);

  await mockDelay(300);
  const active = mockStudentsList.filter((s) => s.status === STUDENT_STATUS.ACTIVE);
  const inPeriod = mockAttendanceRecords.filter(
    (r) => r.date >= period.from && r.date <= period.to && active.some((s) => s.id === r.studentId)
  );

  const perStudent = active.map((student) => ({
    student,
    summary: summarizeAttendance(inPeriod.filter((r) => r.studentId === student.id)),
  }));

  const classes = new Map();
  perStudent.forEach(({ student }) => {
    const key = `${student.grade}|${student.section || ''}`;
    if (!classes.has(key)) classes.set(key, { grade: student.grade, section: student.section, ids: [] });
    classes.get(key).ids.push(student.id);
  });

  const classRates = [...classes.values()]
    .map(({ grade, section, ids }) => ({
      grade,
      section,
      students: ids.length,
      attendanceRate: summarizeAttendance(inPeriod.filter((r) => ids.includes(r.studentId)))
        .attendancePercentage,
    }))
    .sort((a, b) => Number(a.grade) - Number(b.grade) || (a.section || '').localeCompare(b.section || ''));

  const latestDate = inPeriod.reduce((max, r) => (r.date > max ? r.date : max), '');
  const latestDay = latestDate
    ? {
        date: latestDate,
        marked: new Set(inPeriod.filter((r) => r.date === latestDate).map((r) => r.studentId)).size,
        total: active.length,
      }
    : null;

  const attention = perStudent
    .filter(
      ({ summary }) =>
        summary.consecutiveAbsences >= 3 ||
        (summary.attendancePercentage !== null && summary.attendancePercentage < ATTENDANCE_THRESHOLDS.low)
    )
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

/**
 * Attendance records with filters.
 * GET /attendance?date=&from=&to=&grade=&section=&status=&search=&page=&limit=
 * → { records, total, page, limit }
 */
export async function getAttendanceRecords(filters = {}) {
  const {
    date = '',
    from = '',
    to = '',
    grade = '',
    section = '',
    status = '',
    search = '',
    page = 1,
    limit = ATTENDANCE_PAGE_SIZE,
  } = filters;

  if (!USE_MOCKS) {
    return apiClient(
      `/attendance${buildQuery({ date, from, to, grade, section, status, search, page, limit })}`
    );
  }

  await mockDelay(300);
  const q = search.trim().toLowerCase();
  const filtered = mockAttendanceRecords
    .map(withStudent)
    .filter(
      (r) =>
        (!date || r.date === date) &&
        (!from || r.date >= from) &&
        (!to || r.date <= to) &&
        (!grade || r.grade === grade) &&
        (!section || r.section === section) &&
        (!status || r.status === status) &&
        (!q || r.studentName.toLowerCase().includes(q) || r.studentCode.toLowerCase().includes(q))
    )
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.studentName.localeCompare(b.studentName)));

  const start = (page - 1) * limit;
  return { records: filtered.slice(start, start + limit), total: filtered.length, page, limit };
}

/**
 * Class register for one day: every active student in the class with their
 * record for that date (or null if not marked yet).
 * GET /attendance/register?date=&grade=&section=
 */
export async function getClassRegister({ date, grade, section = '' }) {
  if (!USE_MOCKS) return apiClient(`/attendance/register${buildQuery({ date, grade, section })}`);

  await mockDelay(300);
  const students = mockStudentsList
    .filter(
      (s) =>
        s.status === STUDENT_STATUS.ACTIVE &&
        s.grade === grade &&
        (!section || s.section === section)
    )
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
    .map((s) => ({
      student: {
        id: s.id,
        fullName: s.fullName,
        studentCode: s.studentCode,
        grade: s.grade,
        section: s.section,
      },
      record: mockAttendanceRecords.find((r) => r.studentId === s.id && r.date === date) || null,
    }));

  return { date, students };
}

/**
 * Record one attendance entry. Fails with 409 if the student already has a
 * record for that date — correct it with `updateAttendance` instead.
 * POST /attendance → AttendanceRecord
 */
export async function recordAttendance({ studentId, date, status, note = '' }) {
  if (!USE_MOCKS) {
    return apiClient('/attendance', {
      method: 'POST',
      body: JSON.stringify({ studentId, date, status, note }),
    });
  }

  await mockDelay(300);
  const student = validateEntry({ studentId, date, status });
  if (mockAttendanceRecords.some((r) => r.studentId === studentId && r.date === date)) {
    throw new ApiError({
      status: 409,
      code: 'DUPLICATE_ATTENDANCE',
      message: `Attendance for ${student.fullName} on ${date} has already been recorded.`,
    });
  }

  const record = { id: nextMockAttendanceId(), studentId, date, status, note: note.trim(), ...currentRecorder() };
  mockAttendanceRecords.push(record);
  recalculateMockRisk(studentId);
  return withStudent(record);
}

/**
 * Save a class register in one request. Creates missing records and updates
 * existing ones (one record per student per date is preserved).
 * POST /attendance/bulk → { created, updated, records }
 */
export async function saveClassAttendance({ date, entries }) {
  if (!USE_MOCKS) {
    return apiClient('/attendance/bulk', { method: 'POST', body: JSON.stringify({ date, entries }) });
  }

  await mockDelay(450);
  entries.forEach((entry) => validateEntry({ ...entry, date })); // all-or-nothing

  let created = 0;
  let updated = 0;
  const recorder = currentRecorder();
  const saved = entries.map(({ studentId, status, note = '' }) => {
    const existing = mockAttendanceRecords.find((r) => r.studentId === studentId && r.date === date);
    if (existing) {
      if (existing.status !== status || existing.note !== note.trim()) {
        Object.assign(existing, { status, note: note.trim() });
        updated += 1;
      }
      return withStudent(existing);
    }
    const record = { id: nextMockAttendanceId(), studentId, date, status, note: note.trim(), ...recorder };
    mockAttendanceRecords.push(record);
    created += 1;
    return withStudent(record);
  });

  entries.forEach(({ studentId }) => recalculateMockRisk(studentId));
  return { created, updated, records: saved };
}

/**
 * Correct an attendance entry.
 * PATCH /attendance/:id → AttendanceRecord
 */
export async function updateAttendance(id, { status, note }) {
  if (!USE_MOCKS) {
    return apiClient(`/attendance/${id}`, { method: 'PATCH', body: JSON.stringify({ status, note }) });
  }

  await mockDelay(300);
  const record = findRecord(id);
  if (status !== undefined && !ATTENDANCE_STATUSES.includes(status)) {
    throw validationError('Choose Present, Absent, Late or Excused.', 'status');
  }
  if (status !== undefined) record.status = status;
  if (note !== undefined) record.note = note.trim();
  recalculateMockRisk(record.studentId);
  return withStudent(record);
}

/**
 * Remove an entry recorded by mistake (school admin only; reason is audited).
 * DELETE /attendance/:id  body { reason }
 */
export async function deleteAttendance(id, reason) {
  if (!USE_MOCKS) {
    return apiClient(`/attendance/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) });
  }

  await mockDelay(300);
  if (!reason || reason.trim().length < 5) {
    throw validationError('Give a short reason (at least 5 characters).', 'reason');
  }
  const record = findRecord(id);
  mockAttendanceRecords.splice(mockAttendanceRecords.indexOf(record), 1);
  recalculateMockRisk(record.studentId);
  return null;
}

/**
 * One student's attendance summary and history.
 * GET /attendance/student/:studentId?from=&to=
 * → { summary, records }
 */
export async function getStudentAttendance(studentId, { from, to } = {}) {
  if (!USE_MOCKS) return apiClient(`/attendance/student/${studentId}${buildQuery({ from, to })}`);

  await mockDelay(250);
  const records = mockRecordsForStudent(studentId, { from, to }).sort((a, b) => (a.date < b.date ? 1 : -1));
  return { summary: summarizeAttendance(records), records };
}
