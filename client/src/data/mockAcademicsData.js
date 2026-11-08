/**
 * Mock assessments and marks for the Udaan web app (VITE_USE_MOCKS=true only).
 *
 * Shapes match the Udaan API:
 *   Assessment  { id, title, subject, grade, section, assessmentDate, maxMarks,
 *                 createdById, createdByName }
 *   StudentMark { id, studentId, assessmentId, score, recordedById, recordedByName }
 *
 * Contract:
 *   GET    /assessments?search=&grade=&section=&subject=   → { assessments, total }
 *   GET    /assessments/overview                          → see academicService
 *   GET    /assessments/:id      → { assessment, students: [{ student, mark | null }] }
 *   POST   /assessments          body { title, subject, grade, section, assessmentDate, maxMarks }
 *   POST   /marks                body { studentId, assessmentId, score }   (409 on duplicate)
 *   POST   /marks/bulk           body { assessmentId, entries: [{ studentId, score }] }
 *                                → { created, updated }   (upsert per student + assessment)
 *   PATCH  /marks/:id            body { score }
 *
 * The planned percentages below give each demo student a believable story
 * (e.g. Aarav's Mathematics result falls 24 points between unit tests).
 */
import { mockStudentsList } from './mockStudentsData.js';

const TEACHER = { id: 'USR-003', name: 'Neha Gupta' };
const ADMIN = { id: 'USR-001', name: 'Radhika Sharma' };

const PLAN_SUBJECTS = ['Mathematics', 'Science', 'English'];
const TESTS = [
  { key: 'UT1', title: 'Unit Test 1', date: '2026-08-14', maxMarks: 25 },
  { key: 'UT2', title: 'Unit Test 2', date: '2026-10-16', maxMarks: 25 },
];

/** Planned [Unit Test 1 %, Unit Test 2 %] per subject for each student. */
const MARK_PLAN = {
  'STU-1042': { Mathematics: [72, 48], Science: [60, 56], English: [64, 60] },
  'STU-1089': { Mathematics: [68, 56], Science: [64, 60], English: [72, 68] },
  'STU-1120': { Mathematics: [60, 56], Science: [64, 60], English: [56, 56] },
  'STU-1194': { Mathematics: [76, 72], Science: [84, 60], English: [80, 80] },
  'STU-1205': { Mathematics: [64, 68], Science: [68, 64], English: [72, 72] },
  'STU-1231': { Mathematics: [76, 72], Science: [72, 72], English: [80, 76] },
  'STU-1011': { Mathematics: [92, 96], Science: [88, 92], English: [96, 92] },
  'STU-1025': { Mathematics: [88, 88], Science: [92, 88], English: [84, 88] },
  'STU-0987': { Mathematics: [80, null], Science: [76, null], English: [84, null] }, // left before UT2
};

function generate() {
  const assessments = [];
  const marks = [];
  let assessmentCounter = 1;
  let markCounter = 1;

  // One set of assessments per class with planned marks (Grade 6-A's only
  // student joined in November, after these tests).
  const classes = [...new Set(mockStudentsList.filter((s) => MARK_PLAN[s.id]).map((s) => `${s.grade}|${s.section}`))]
    .map((key) => key.split('|'))
    .sort((a, b) => Number(a[0]) - Number(b[0]) || a[1].localeCompare(b[1]));

  classes.forEach(([grade, section]) => {
    TESTS.forEach((test) => {
      PLAN_SUBJECTS.forEach((subject) => {
        const author = grade === '8' && section === 'A' ? TEACHER : ADMIN;
        const assessment = {
          id: `ASM-${String(assessmentCounter++).padStart(3, '0')}`,
          title: test.title,
          subject,
          grade,
          section,
          assessmentDate: test.date,
          maxMarks: test.maxMarks,
          createdById: author.id,
          createdByName: author.name,
        };
        assessments.push(assessment);

        mockStudentsList
          .filter((s) => s.grade === grade && s.section === section)
          .forEach((student) => {
            const planned = MARK_PLAN[student.id]?.[subject]?.[test.key === 'UT1' ? 0 : 1];
            if (planned === null || planned === undefined) return;
            const recorder = student.assignedTeacherId ? TEACHER : ADMIN;
            marks.push({
              id: `MRK-${String(markCounter++).padStart(4, '0')}`,
              studentId: student.id,
              assessmentId: assessment.id,
              score: Math.round((planned / 100) * test.maxMarks * 2) / 2,
              recordedById: recorder.id,
              recordedByName: recorder.name,
            });
          });
      });
    });
  });

  return { assessments, marks };
}

const generated = generate();

/** Mutable in-memory stores used by the mock services. */
export const mockAssessments = generated.assessments;
export const mockMarks = generated.marks;

export function nextMockId(list, prefix, width) {
  const max = list.reduce((acc, item) => Math.max(acc, Number(item.id.replace(/\D/g, '')) || 0), 0);
  return `${prefix}-${String(max + 1).padStart(width, '0')}`;
}

/** A student's marks joined with assessment details (for risk and profiles). */
export function mockMarksForStudent(studentId) {
  return mockMarks
    .filter((m) => m.studentId === studentId)
    .map((m) => {
      const a = mockAssessments.find((x) => x.id === m.assessmentId);
      return a
        ? { ...m, title: a.title, subject: a.subject, assessmentDate: a.assessmentDate, maxMarks: a.maxMarks }
        : null;
    })
    .filter(Boolean);
}
