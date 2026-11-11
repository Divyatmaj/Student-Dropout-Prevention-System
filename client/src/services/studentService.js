import { summarizeAttendance, averagePercentage, toPercentage, isInterventionOverdue } from '@udaan/shared';

import { apiClient, ApiError, USE_MOCKS, mockDelay, buildQuery } from './api.js';
import { mockRecordsForStudent } from './attendanceService.js';
import { mockStudentsList } from '../data/mockStudentsData.js';
import { mockMarksForStudent } from '../data/mockAcademicsData.js';
import { mockRiskAssessments, recalculateMockRisk, needsReview } from '../data/mockRiskStore.js';
import { mockInterventionsList } from '../data/mockInterventionsData.js';
import { STUDENTS_PAGE_SIZE, STUDENT_STATUS } from '../constants/students.js';
import { mockUsers } from '../data/mockUsersData.js';
import { todayISO } from '../utils/formatters.js';
import { EMPTY_STUDENT_FORM, toStudentPayload, validateStudentForm } from '../utils/studentValidation.js';

/* -------------------------------------------------------------------------- */
/* Mock helpers                                                               */
/* -------------------------------------------------------------------------- */

function notFound() {
  return new ApiError({ status: 404, code: 'STUDENT_NOT_FOUND', message: 'Student not found.' });
}

function assertUniqueCode(studentCode, ignoreId = null) {
  const clash = mockStudentsList.find(
    (s) => s.studentCode.toUpperCase() === studentCode.toUpperCase() && s.id !== ignoreId
  );
  if (clash) {
    throw new ApiError({
      status: 409,
      code: 'DUPLICATE_STUDENT_CODE',
      message: `Student code ${studentCode} is already used by another student in this school.`,
      details: [{ field: 'studentCode', message: 'This student code is already in use.' }],
    });
  }
}

/** Mock mode: resolve the class teacher's name, as the API joins it in. */
function withTeacherName(values) {
  if (!('assignedTeacherId' in values)) return values;
  const teacher = mockUsers.find((u) => u.id === values.assignedTeacherId && u.role === 'TEACHER' && u.isActive);
  if (values.assignedTeacherId && !teacher) {
    throw new ApiError({
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Please fix the highlighted fields.',
      details: [{ field: 'assignedTeacherId', message: 'Choose an active teacher from this school.' }],
    });
  }
  return { ...values, assignedTeacherId: teacher?.id ?? null, assignedTeacherName: teacher?.name ?? null };
}

function findMockStudent(id) {
  const student = mockStudentsList.find((s) => s.id === id);
  if (!student) throw notFound();
  return student;
}

/** Student plus the computed fields list views show (API joins these in). */
function withComputedFields(student) {
  const risk = mockRiskAssessments.get(student.id);
  return {
    ...student,
    attendanceRate: summarizeAttendance(mockRecordsForStudent(student.id)).attendancePercentage,
    riskScore: risk?.score ?? null,
    riskCategory: risk?.category ?? null,
    riskDataStatus: risk?.dataStatus ?? null,
    topRiskReason: risk?.reasons[0]?.label ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/* Service functions                                                          */
/* -------------------------------------------------------------------------- */

/**
 * List students with search, filters and pagination.
 * GET /students?search=&grade=&section=&status=&riskCategory=&page=&limit=
 * → { students, total, page, limit }
 */
export async function getStudents(filters = {}) {
  const {
    search = '',
    grade = '',
    section = '',
    status = '',
    riskCategory = '',
    page = 1,
    limit = STUDENTS_PAGE_SIZE,
  } = filters;

  if (!USE_MOCKS) {
    return apiClient(
      `/students${buildQuery({ search, grade, section, status, riskCategory, page, limit })}`
    );
  }

  await mockDelay(300);
  let filtered = mockStudentsList.map(withComputedFields);

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (s) => s.fullName.toLowerCase().includes(q) || s.studentCode.toLowerCase().includes(q)
    );
  }
  if (grade) filtered = filtered.filter((s) => s.grade === grade);
  if (section) filtered = filtered.filter((s) => s.section === section);
  if (status) filtered = filtered.filter((s) => s.status === status);
  if (riskCategory) filtered = filtered.filter((s) => s.riskCategory === riskCategory);

  filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
  const start = (page - 1) * limit;

  return {
    students: filtered.slice(start, start + limit),
    total: filtered.length,
    page,
    limit,
  };
}

function importBoolean(value) {
  if (value === undefined || value === null || value === '') return { value: false };
  if (typeof value === 'boolean') return { value };
  const normalized = String(value).trim().toLowerCase();
  if (['true', 'yes', 'y', '1'].includes(normalized)) return { value: true };
  if (['false', 'no', 'n', '0'].includes(normalized)) return { value: false };
  return { error: 'Use true/false, yes/no, or 1/0.' };
}

export async function previewStudentImport(rows) {
  if (!USE_MOCKS) {
    return apiClient('/students/import/preview', { method: 'POST', body: JSON.stringify({ rows }) });
  }

  await mockDelay(250);
  const teacherByEmail = new Map(mockUsers.filter((u) => u.role === 'TEACHER' && u.isActive).map((u) => [u.email.toLowerCase(), u]));
  const preview = rows.map((row, index) => {
    const errors = [];
    const barrier = importBoolean(row.financialBarrierReported);
    if (barrier.error) errors.push({ field: 'financialBarrierReported', message: barrier.error });
    const email = String(row.classTeacherEmail ?? '').trim().toLowerCase();
    const teacher = email ? teacherByEmail.get(email) : null;
    if (email && !teacher) errors.push({ field: 'classTeacherEmail', message: 'No active teacher with this email exists in the school.' });
    const formValues = {
      ...EMPTY_STUDENT_FORM,
      ...row,
      financialBarrierReported: barrier.value,
      assignedTeacherId: teacher?.id ?? '',
    };
    const validation = validateStudentForm(formValues);
    Object.entries(validation).forEach(([field, message]) => errors.push({ field, message }));
    const values = { ...toStudentPayload(formValues), classTeacherEmail: email, classTeacherName: teacher?.name ?? null };
    return { rowNumber: row.rowNumber || index + 2, values, errors };
  });

  const codeCounts = new Map();
  preview.forEach(({ values }) => {
    const code = String(values.studentCode || '').toUpperCase();
    if (code) codeCounts.set(code, (codeCounts.get(code) || 0) + 1);
  });
  preview.forEach((row) => {
    const code = String(row.values.studentCode || '').toUpperCase();
    if (code && mockStudentsList.some((student) => student.studentCode.toUpperCase() === code)) {
      row.errors.push({ field: 'studentCode', message: 'This code is already used by a student in this school.' });
    } else if (code && codeCounts.get(code) > 1) {
      row.errors.push({ field: 'studentCode', message: 'This student code appears more than once in the CSV.' });
    }
  });

  return {
    rows: preview,
    validCount: preview.filter((row) => row.errors.length === 0).length,
    errorCount: preview.reduce((sum, row) => sum + row.errors.length, 0),
  };
}

export async function importStudentsBulk(rows) {
  if (!USE_MOCKS) {
    return apiClient('/students/import', { method: 'POST', body: JSON.stringify({ rows }) });
  }

  const preview = await previewStudentImport(rows);
  if (preview.errorCount) {
    throw new ApiError({ status: 422, code: 'STUDENT_IMPORT_INVALID', message: 'Fix the CSV errors and preview again.' });
  }
  const teacherByEmail = new Map(mockUsers.filter((u) => u.role === 'TEACHER' && u.isActive).map((u) => [u.email.toLowerCase(), u]));
  const created = rows.map((row) => {
    const teacher = teacherByEmail.get(String(row.classTeacherEmail ?? '').trim().toLowerCase());
    const payload = toStudentPayload({
      ...EMPTY_STUDENT_FORM,
      ...row,
      financialBarrierReported: importBoolean(row.financialBarrierReported).value,
      assignedTeacherId: teacher?.id ?? '',
    });
    const student = {
      id: `STU-${Math.floor(2000 + Math.random() * 8000)}`,
      status: STUDENT_STATUS.ACTIVE,
      assignedTeacherId: null,
      assignedTeacherName: null,
      ...withTeacherName(payload),
    };
    mockStudentsList.unshift(student);
    recalculateMockRisk(student.id);
    return student;
  });
  return { imported: created.length, students: created.map(({ id, studentCode, fullName }) => ({ id, studentCode, fullName })) };
}

/**
 * One student record.
 * GET /students/:id
 */
export async function getStudent(id) {
  if (!USE_MOCKS) return apiClient(`/students/${id}`);

  await mockDelay(250);
  return withComputedFields(findMockStudent(id));
}

/**
 * Student profile with attendance, marks, risk and interventions.
 * GET /students/:id/summary
 */
export async function getStudentSummary(id) {
  if (!USE_MOCKS) return apiClient(`/students/${id}/summary`);

  await mockDelay(350);
  const student = findMockStudent(id);

  const attendanceRecords = mockRecordsForStudent(id).sort((a, b) => (a.date < b.date ? 1 : -1));
  const attendance = {
    ...summarizeAttendance(attendanceRecords),
    recent: attendanceRecords.slice(0, 10),
  };

  const marks = mockMarksForStudent(id)
    .map((m) => ({ ...m, percentage: toPercentage(m.score, m.maxMarks) }))
    .sort((x, y) => (x.assessmentDate < y.assessmentDate ? 1 : x.assessmentDate > y.assessmentDate ? -1 : x.subject.localeCompare(y.subject)));

  const academics = {
    assessmentsRecorded: marks.length,
    averagePercentage: averagePercentage(marks),
    recent: marks,
  };

  // Summary rows only: descriptions and history stay on GET /interventions/:id.
  const today = todayISO();
  const interventions = mockInterventionsList
    .filter((i) => i.studentId === id)
    .map((i) => ({
      id: i.id,
      category: i.category,
      priority: i.priority,
      status: i.status,
      dueDate: i.dueDate,
      followUpDate: i.followUpDate,
      assignedToName: i.assignedToName,
      createdAt: i.createdAt,
      outcome: i.outcome,
      isOverdue: isInterventionOverdue(i, today),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const assessment = mockRiskAssessments.get(id);
  const risk = assessment ? { ...assessment, needsReview: needsReview(assessment) } : null;

  return { student: withComputedFields(student), attendance, academics, risk, interventions };
}

/**
 * Create a student.
 * POST /students → Student
 */
export async function createStudent(payload) {
  if (!USE_MOCKS) {
    return apiClient('/students', { method: 'POST', body: JSON.stringify(payload) });
  }

  await mockDelay(400);
  assertUniqueCode(payload.studentCode);

  const student = {
    id: `STU-${Math.floor(2000 + Math.random() * 8000)}`,
    assignedTeacherId: null,
    assignedTeacherName: null,
    ...withTeacherName(payload),
    status: STUDENT_STATUS.ACTIVE,
  };
  mockStudentsList.unshift(student);
  recalculateMockRisk(student.id);
  return withComputedFields(student);
}

/**
 * Update a student's details.
 * PATCH /students/:id → Student
 */
export async function updateStudent(id, payload) {
  if (!USE_MOCKS) {
    return apiClient(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  }

  await mockDelay(400);
  const student = findMockStudent(id);
  if (payload.studentCode) assertUniqueCode(payload.studentCode, id);

  Object.assign(student, withTeacherName(payload));
  recalculateMockRisk(id); // e.g. the financial-barrier flag changed
  return withComputedFields(student);
}

/**
 * Change enrolment status (deactivate / transfer / complete / reactivate).
 * Students are never hard-deleted, so their history is kept.
 * PATCH /students/:id/status → Student
 */
export async function updateStudentStatus(id, status) {
  if (!USE_MOCKS) {
    return apiClient(`/students/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  await mockDelay(350);
  if (!Object.values(STUDENT_STATUS).includes(status)) {
    throw new ApiError({ status: 422, code: 'VALIDATION_ERROR', message: 'Invalid student status.' });
  }
  const student = findMockStudent(id);
  student.status = status;
  recalculateMockRisk(id); // inactive students drop out of risk lists
  return withComputedFields(student);
}
