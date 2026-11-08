/**
 * Who can see which records.
 *
 * Everything is limited to the user's school. Teachers are further limited
 * to the students explicitly assigned to them (Student.assignedTeacherId) —
 * the PRD's documented fallback until class-teacher assignments exist.
 * Out-of-scope ids are reported as "not found" so they reveal nothing.
 */
import { getPrisma } from '../config/prisma.js';
import { notFound } from '../utils/AppError.js';

export const isTeacher = (user) => user.role === 'TEACHER';

/** Prisma `where` for the students this user may see. */
export function studentScope(user, extra = {}) {
  return {
    schoolId: user.schoolId,
    ...(isTeacher(user) && { assignedTeacherId: user.id }),
    ...extra,
  };
}

/** Load one student in scope or throw 404 STUDENT_NOT_FOUND. */
export async function findStudentInScope(user, id, { select, include, db = getPrisma() } = {}) {
  const student = await db.student.findFirst({ where: studentScope(user, { id }), ...(select ? { select } : {}), ...(include ? { include } : {}) });
  if (!student) throw notFound('Student not found.', 'STUDENT_NOT_FOUND');
  return student;
}

/** Classes (grade + section) of a teacher's assigned students. */
export async function teacherClasses(user) {
  const rows = await getPrisma().student.findMany({
    where: { schoolId: user.schoolId, assignedTeacherId: user.id },
    select: { grade: true, section: true },
    distinct: ['grade', 'section'],
  });
  return rows;
}

/**
 * Prisma `where` for the assessments this user may see: all in the school,
 * or for teachers, those for their students' classes (a whole-grade
 * assessment counts for every section) plus any they created.
 */
export async function assessmentScope(user, extra = {}) {
  const base = { schoolId: user.schoolId, ...extra };
  if (!isTeacher(user)) return base;
  const classes = await teacherClasses(user);
  return {
    ...base,
    OR: [
      { createdById: user.id },
      ...classes.map(({ grade, section }) => ({ grade, OR: [{ section }, { section: null }] })),
    ],
  };
}
