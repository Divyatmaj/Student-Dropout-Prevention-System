/**
 * Students: list, profile summary, create, update, enrolment status.
 * Students are never hard-deleted; their history is kept.
 */
import {
  summarizeAttendance,
  averagePercentage,
  toPercentage,
  isInterventionOverdue,
  needsReview,
  can,
  PERMISSIONS,
  STUDENT_ENROLMENT_FIELDS,
} from '@udaan/shared';

import { getPrisma } from '../config/prisma.js';
import { AppError, forbidden, validationError } from '../utils/AppError.js';
import { fromDbDate, toDbDate, schoolToday } from '../utils/dates.js';
import { studentScope, findStudentInScope } from './scope.js';
import { recalculateStudentRisk } from './risk.service.js';
import { toAttendanceRecord } from './attendance.service.js';
import { toRiskAssessment } from './serializers.js';

const STUDENT_INCLUDE = {
  assignedTeacher: { select: { id: true, name: true } },
  riskAssessment: { select: { score: true, category: true, dataStatus: true, reasons: true } },
};

/** Attendance % per student from status counts (same policy as @udaan/shared). */
export async function attendanceRates(studentIds, db = getPrisma()) {
  if (studentIds.length === 0) return new Map();
  const groups = await db.attendance.groupBy({
    by: ['studentId', 'status'],
    where: { studentId: { in: studentIds } },
    _count: { _all: true },
  });
  const counts = new Map();
  groups.forEach((g) => {
    const c = counts.get(g.studentId) || { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
    c[g.status] = g._count._all;
    counts.set(g.studentId, c);
  });
  const rates = new Map();
  counts.forEach((c, id) => {
    const eligible = c.PRESENT + c.LATE + c.ABSENT;
    rates.set(id, eligible === 0 ? null : Math.round(((c.PRESENT + c.LATE) / eligible) * 1000) / 10);
  });
  return rates;
}

/** API shape of a student (dates as YYYY-MM-DD, plus computed list fields). */
export function toStudent(s, attendanceRate = null) {
  const risk = s.riskAssessment;
  return {
    id: s.id,
    studentCode: s.studentCode,
    fullName: s.fullName,
    dateOfBirth: fromDbDate(s.dateOfBirth),
    grade: s.grade,
    section: s.section,
    admissionDate: fromDbDate(s.admissionDate),
    status: s.status,
    guardianName: s.guardianName,
    guardianPhone: s.guardianPhone,
    guardianRelationship: s.guardianRelationship,
    financialBarrierReported: s.financialBarrierReported,
    supportNotes: s.supportNotes,
    assignedTeacherId: s.assignedTeacherId,
    assignedTeacherName: s.assignedTeacher?.name ?? null,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    attendanceRate,
    riskScore: risk?.score ?? null,
    riskCategory: risk?.category ?? null,
    riskDataStatus: risk?.dataStatus ?? null,
    topRiskReason: risk?.reasons?.[0]?.label ?? null,
  };
}

async function withRate(student, db = getPrisma()) {
  const rates = await attendanceRates([student.id], db);
  return toStudent(student, rates.get(student.id) ?? null);
}

const duplicateCode = (code) =>
  new AppError({
    status: 409,
    code: 'DUPLICATE_STUDENT_CODE',
    message: `Student code ${code} is already used by another student in this school.`,
    details: [{ field: 'studentCode', message: 'This student code is already in use.' }],
  });

async function assertCodeFree(schoolId, studentCode, exceptId) {
  const clash = await getPrisma().student.findFirst({
    where: { schoolId, studentCode, ...(exceptId && { id: { not: exceptId } }) },
    select: { id: true },
  });
  if (clash) throw duplicateCode(studentCode);
}

async function assertTeacher(schoolId, teacherId) {
  if (!teacherId) return;
  const teacher = await getPrisma().user.findFirst({
    where: { id: teacherId, schoolId, role: 'TEACHER', isActive: true },
    select: { id: true },
  });
  if (!teacher) throw validationError([{ field: 'assignedTeacherId', message: 'Choose an active teacher from this school.' }]);
}

function toData(values) {
  const data = { ...values };
  if ('dateOfBirth' in data) data.dateOfBirth = toDbDate(data.dateOfBirth);
  if ('admissionDate' in data) data.admissionDate = toDbDate(data.admissionDate);
  return data;
}

/** GET /students */
export async function listStudents(user, { search, grade, section, status, riskCategory, page, limit }) {
  const where = studentScope(user, {
    ...(grade && { grade }),
    ...(section && { section }),
    ...(status && { status }),
    ...(riskCategory && { riskAssessment: { category: riskCategory } }),
    ...(search && {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { studentCode: { contains: search, mode: 'insensitive' } },
      ],
    }),
  });
  const db = getPrisma();
  const [total, rows] = await Promise.all([
    db.student.count({ where }),
    db.student.findMany({
      where,
      include: STUDENT_INCLUDE,
      orderBy: [{ fullName: 'asc' }, { studentCode: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  const rates = await attendanceRates(rows.map((s) => s.id));
  return { students: rows.map((s) => toStudent(s, rates.get(s.id) ?? null)), total, page, limit };
}

/** GET /students/:id */
export async function getStudent(user, id) {
  return withRate(await findStudentInScope(user, id, { include: STUDENT_INCLUDE }));
}

/** GET /students/:id/summary — profile with attendance, marks, risk and interventions. */
export async function getStudentSummary(user, id) {
  const db = getPrisma();
  const student = await findStudentInScope(user, id, { include: STUDENT_INCLUDE });

  const [attendanceRows, markRows, risk, interventionRows] = await Promise.all([
    db.attendance.findMany({
      where: { studentId: id },
      include: { recordedBy: { select: { name: true } } },
      orderBy: { date: 'desc' },
    }),
    db.studentMark.findMany({
      where: { studentId: id },
      include: { assessment: { select: { title: true, subject: true, assessmentDate: true, maxMarks: true } } },
    }),
    db.riskAssessment.findUnique({ where: { studentId: id }, include: { reviewedBy: { select: { name: true } } } }),
    db.intervention.findMany({
      where: { studentId: id },
      include: { assignedTo: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const records = attendanceRows.map(toAttendanceRecord);
  const attendance = { ...summarizeAttendance(records), recent: records.slice(0, 10) };

  const marks = markRows
    .map((m) => ({
      id: m.id,
      studentId: m.studentId,
      assessmentId: m.assessmentId,
      score: m.score,
      title: m.assessment.title,
      subject: m.assessment.subject,
      assessmentDate: fromDbDate(m.assessment.assessmentDate),
      maxMarks: m.assessment.maxMarks,
      percentage: toPercentage(m.score, m.assessment.maxMarks),
    }))
    .sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate) || a.subject.localeCompare(b.subject));

  const today = schoolToday();
  const interventions = interventionRows.map((i) => {
    const row = { status: i.status, dueDate: fromDbDate(i.dueDate) };
    return {
      id: i.id,
      category: i.category,
      priority: i.priority,
      status: i.status,
      dueDate: row.dueDate,
      followUpDate: fromDbDate(i.followUpDate),
      assignedToName: i.assignedTo?.name ?? null,
      createdAt: i.createdAt,
      outcome: i.outcome,
      isOverdue: isInterventionOverdue(row, today),
    };
  });

  return {
    student: toStudent(student, attendance.attendancePercentage),
    attendance,
    academics: { assessmentsRecorded: marks.length, averagePercentage: averagePercentage(marks), recent: marks },
    risk: risk ? { ...toRiskAssessment(risk), needsReview: needsReview(risk) } : null,
    interventions,
  };
}

/** POST /students (school admin, principal) */
export async function createStudent(user, values) {
  await assertCodeFree(user.schoolId, values.studentCode);
  await assertTeacher(user.schoolId, values.assignedTeacherId);
  const student = await getPrisma().student.create({
    data: { ...toData(values), schoolId: user.schoolId, status: 'ACTIVE' },
  });
  await recalculateStudentRisk(student.id);
  return getStudent(user, student.id);
}

/**
 * PATCH /students/:id
 * Teachers may change only guardian contact, the financial-barrier flag and
 * support notes, and only for their assigned students.
 */
export async function updateStudent(user, id, values) {
  const existing = await findStudentInScope(user, id);
  const enrolmentChanges = STUDENT_ENROLMENT_FIELDS.filter((f) => f in values);
  if (enrolmentChanges.length && !can(user, PERMISSIONS.STUDENT_EDIT_ENROLMENT)) {
    throw forbidden('Only a school administrator or principal can change enrolment details.');
  }
  if (values.studentCode && values.studentCode !== existing.studentCode) {
    await assertCodeFree(user.schoolId, values.studentCode, id);
  }
  if ('assignedTeacherId' in values && values.assignedTeacherId !== existing.assignedTeacherId) {
    await assertTeacher(user.schoolId, values.assignedTeacherId);
  }

  await getPrisma().student.update({ where: { id }, data: toData(values) });
  if ('financialBarrierReported' in values) await recalculateStudentRisk(id);
  return getStudent(user, id);
}

/** PATCH /students/:id/status (school admin). Inactive students drop out of risk lists. */
export async function setStudentStatus(user, id, status) {
  await findStudentInScope(user, id);
  await getPrisma().student.update({ where: { id }, data: { status } });
  await recalculateStudentRisk(id);
  return getStudent(user, id);
}
