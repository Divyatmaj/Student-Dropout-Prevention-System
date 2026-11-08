import {
  toPercentage,
  validateScore,
  averagePercentage,
  calculateAcademicDecline,
  ACADEMIC_DECLINE_THRESHOLDS,
} from '@udaan/shared';

import { apiClient, ApiError, USE_MOCKS, mockDelay, buildQuery } from './api.js';
import { getMockSessionUser } from './authService.js';
import { mockAssessments, mockMarks, mockMarksForStudent, nextMockId } from '../data/mockAcademicsData.js';
import { mockStudentsList } from '../data/mockStudentsData.js';
import { recalculateMockRisk } from '../data/mockRiskStore.js';
import { GRADES, SECTIONS, STUDENT_STATUS } from '../constants/students.js';
import { todayISO } from '../utils/formatters.js';

/* -------------------------------------------------------------------------- */
/* Mock helpers                                                               */
/* -------------------------------------------------------------------------- */

function validationError(message, details = []) {
  return new ApiError({ status: 422, code: 'VALIDATION_ERROR', message, details });
}

function currentUser() {
  const user = getMockSessionUser();
  return { id: user?.id ?? null, name: user?.name ?? 'Staff' };
}

function findAssessment(id) {
  const assessment = mockAssessments.find((a) => a.id === id);
  if (!assessment) {
    throw new ApiError({ status: 404, code: 'ASSESSMENT_NOT_FOUND', message: 'Assessment not found.' });
  }
  return assessment;
}

/** Students who were in the class when the assessment took place. */
function classStudents(assessment) {
  return mockStudentsList.filter(
    (s) =>
      s.grade === assessment.grade &&
      (!assessment.section || s.section === assessment.section) &&
      (!s.admissionDate || s.admissionDate <= assessment.assessmentDate)
  );
}

function withStats(assessment) {
  const marks = mockMarks.filter((m) => m.assessmentId === assessment.id);
  const activeInClass = classStudents(assessment).filter((s) => s.status === STUDENT_STATUS.ACTIVE);
  return {
    ...assessment,
    marksCount: marks.length,
    classSize: activeInClass.length,
    missingMarks: activeInClass.filter((s) => !marks.some((m) => m.studentId === s.id)).length,
    averagePercentage: averagePercentage(marks.map((m) => ({ ...m, maxMarks: assessment.maxMarks }))),
  };
}

/* -------------------------------------------------------------------------- */
/* Service functions                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Academic overview.
 * GET /assessments/overview
 * → { assessmentsCount, marksCount, averagePercentage, pendingAssessments,
 *     declining: [{ studentId, studentName, studentCode, grade, section,
 *                   subject, previous, latest, drop }] }
 */
export async function getAcademicOverview() {
  if (!USE_MOCKS) return apiClient('/assessments/overview');

  await mockDelay(300);
  const active = mockStudentsList.filter((s) => s.status === STUDENT_STATUS.ACTIVE);

  const declining = active
    .map((student) => ({ student, decline: calculateAcademicDecline(mockMarksForStudent(student.id)) }))
    .filter(({ decline }) => decline && decline.drop >= ACADEMIC_DECLINE_THRESHOLDS.moderate)
    .map(({ student, decline }) => ({
      studentId: student.id,
      studentName: student.fullName,
      studentCode: student.studentCode,
      grade: student.grade,
      section: student.section,
      ...decline,
    }))
    .sort((a, b) => b.drop - a.drop);

  const allMarks = mockMarks.map((m) => ({
    ...m,
    maxMarks: mockAssessments.find((a) => a.id === m.assessmentId)?.maxMarks,
  }));

  return {
    assessmentsCount: mockAssessments.length,
    marksCount: mockMarks.length,
    averagePercentage: averagePercentage(allMarks),
    pendingAssessments: mockAssessments.map(withStats).filter((a) => a.missingMarks > 0).length,
    declining,
  };
}

/**
 * Assessments with filters, newest first.
 * GET /assessments?search=&grade=&section=&subject=
 * → { assessments: [...Assessment, marksCount, classSize, missingMarks, averagePercentage], total }
 */
export async function getAssessments(filters = {}) {
  const { search = '', grade = '', section = '', subject = '' } = filters;
  if (!USE_MOCKS) return apiClient(`/assessments${buildQuery({ search, grade, section, subject })}`);

  await mockDelay(300);
  const q = search.trim().toLowerCase();
  const assessments = mockAssessments
    .filter(
      (a) =>
        (!grade || a.grade === grade) &&
        (!section || a.section === section) &&
        (!subject || a.subject === subject) &&
        (!q || a.title.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q))
    )
    .map(withStats)
    .sort(
      (a, b) =>
        (a.assessmentDate < b.assessmentDate ? 1 : a.assessmentDate > b.assessmentDate ? -1 : 0) ||
        Number(a.grade) - Number(b.grade) ||
        (a.section || '').localeCompare(b.section || '') ||
        a.subject.localeCompare(b.subject)
    );
  return { assessments, total: assessments.length };
}

/**
 * Create an assessment for a class.
 * POST /assessments → Assessment
 */
export async function createAssessment(payload) {
  if (!USE_MOCKS) return apiClient('/assessments', { method: 'POST', body: JSON.stringify(payload) });

  await mockDelay(400);
  const details = [];
  const title = (payload.title || '').trim();
  const subject = (payload.subject || '').trim();
  const maxMarks = Number(payload.maxMarks);

  if (title.length < 2) details.push({ field: 'title', message: 'Enter a title.' });
  if (!subject) details.push({ field: 'subject', message: 'Choose a subject.' });
  if (!GRADES.includes(payload.grade)) details.push({ field: 'grade', message: 'Choose a grade.' });
  if (payload.section && !SECTIONS.includes(payload.section)) details.push({ field: 'section', message: 'Choose a valid section.' });
  if (!payload.assessmentDate) details.push({ field: 'assessmentDate', message: 'Choose a date.' });
  else if (payload.assessmentDate > todayISO()) details.push({ field: 'assessmentDate', message: 'The date cannot be in the future.' });
  if (!Number.isFinite(maxMarks) || maxMarks <= 0 || maxMarks > 1000) {
    details.push({ field: 'maxMarks', message: 'Maximum marks must be between 1 and 1000.' });
  }
  if (details.length) throw validationError('Please fix the highlighted fields.', details);

  const user = currentUser();
  const assessment = {
    id: nextMockId(mockAssessments, 'ASM', 3),
    title,
    subject,
    grade: payload.grade,
    section: payload.section || null,
    assessmentDate: payload.assessmentDate,
    maxMarks,
    createdById: user.id,
    createdByName: user.name,
  };
  mockAssessments.push(assessment);
  return withStats(assessment);
}

/**
 * An assessment with its marks sheet: every student in the class (active
 * students, plus anyone who already has a mark) with their mark or null.
 * GET /assessments/:id → { assessment, students: [{ student, mark }] }
 */
export async function getAssessment(id) {
  if (!USE_MOCKS) return apiClient(`/assessments/${id}`);

  await mockDelay(300);
  const assessment = findAssessment(id);
  const marks = mockMarks.filter((m) => m.assessmentId === id);
  const students = classStudents(assessment)
    .filter((s) => s.status === STUDENT_STATUS.ACTIVE || marks.some((m) => m.studentId === s.id))
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
    .map((s) => {
      const mark = marks.find((m) => m.studentId === s.id) || null;
      return {
        student: { id: s.id, fullName: s.fullName, studentCode: s.studentCode, status: s.status },
        mark: mark ? { ...mark, percentage: toPercentage(mark.score, assessment.maxMarks) } : null,
      };
    });
  return { assessment: withStats(assessment), students };
}

/**
 * Save a marks sheet. Creates missing marks and corrects existing ones
 * (one mark per student per assessment). All-or-nothing validation.
 * POST /marks/bulk → { created, updated }
 */
export async function saveMarks(assessmentId, entries) {
  if (!USE_MOCKS) {
    return apiClient('/marks/bulk', { method: 'POST', body: JSON.stringify({ assessmentId, entries }) });
  }

  await mockDelay(450);
  const assessment = findAssessment(assessmentId);
  const details = entries
    .map(({ studentId, score }) => {
      const message = validateScore(score, assessment.maxMarks);
      return message ? { field: `score.${studentId}`, message } : null;
    })
    .filter(Boolean);
  if (details.length) throw validationError('Some scores are not valid.', details);

  const user = currentUser();
  let created = 0;
  let updated = 0;
  entries.forEach(({ studentId, score }) => {
    const value = Number(score);
    const existing = mockMarks.find((m) => m.studentId === studentId && m.assessmentId === assessmentId);
    if (existing) {
      if (existing.score !== value) {
        existing.score = value;
        updated += 1;
      }
    } else {
      mockMarks.push({
        id: nextMockId(mockMarks, 'MRK', 4),
        studentId,
        assessmentId,
        score: value,
        recordedById: user.id,
        recordedByName: user.name,
      });
      created += 1;
    }
    recalculateMockRisk(studentId);
  });
  return { created, updated };
}
