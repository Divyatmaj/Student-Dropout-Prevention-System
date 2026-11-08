import { summarizeAttendance } from '@udaan/shared';

import { apiClient, ApiError, USE_MOCKS, mockDelay, buildQuery } from './api.js';
import { mockRecordsForStudent } from './attendanceService.js';
import { mockStudentsList } from '../data/mockStudentsData.js';
import { mockAssessmentResults } from '../data/mockAcademicsData.js';
import { mockInterventionsList } from '../data/mockInterventionsData.js';
import { STUDENTS_PAGE_SIZE, STUDENT_STATUS } from '../constants/students.js';

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

function findMockStudent(id) {
  const student = mockStudentsList.find((s) => s.id === id);
  if (!student) throw notFound();
  return student;
}

/** Student plus the computed fields list views show (API joins these in). */
function withComputedFields(student) {
  return {
    ...student,
    attendanceRate: summarizeAttendance(mockRecordsForStudent(student.id)).attendancePercentage,
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
  let filtered = [...mockStudentsList];

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
    students: filtered.slice(start, start + limit).map(withComputedFields),
    total: filtered.length,
    page,
    limit,
  };
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

  const marks = mockAssessmentResults
    .filter((r) => r.studentId === id)
    .map((r) => ({
      id: r.id,
      title: r.assessmentName,
      subject: r.course,
      assessmentDate: r.date,
      score: r.score,
      maxMarks: r.maxScore,
      percentage: Math.round((r.score / r.maxScore) * 1000) / 10,
    }));

  const academics = {
    assessmentsRecorded: marks.length,
    averagePercentage: marks.length
      ? Math.round((marks.reduce((sum, m) => sum + m.percentage, 0) / marks.length) * 10) / 10
      : null,
    recent: marks,
  };

  const interventions = mockInterventionsList
    .filter((i) => i.studentId === id)
    .map((i) => ({
      id: i.id,
      date: i.createdDate,
      type: i.type,
      counselor: i.counselorName,
      priority: i.priority,
      status: i.status,
      notes: i.notes,
    }));

  const risk = {
    score: student.riskScore,
    category: student.riskCategory,
    topReason: student.topRiskReason,
  };

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
    ...payload,
    status: STUDENT_STATUS.ACTIVE,
    assignedTeacherId: null,
    assignedTeacherName: null,
    riskScore: null,
    riskCategory: 'INSUFFICIENT_DATA',
    topRiskReason: 'Not enough attendance or marks recorded yet',
  };
  mockStudentsList.unshift(student);
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

  Object.assign(student, payload);
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
  return withComputedFields(student);
}
