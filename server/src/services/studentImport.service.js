import { createStudentSchema } from '../validators/student.validator.js';
import { AppError } from '../utils/AppError.js';
import { toDbDate } from '../utils/dates.js';
import { zodIssuesToDetails } from '../middleware/validate.js';
import { getPrisma } from '../config/prisma.js';
import { recalculateMany } from './risk.service.js';

const MAX_IMPORT_ROWS = 50;

function normalizeBoolean(value) {
  if (value === undefined || value === null || value === '') return { value: false };
  if (typeof value === 'boolean') return { value };
  const normalized = String(value).trim().toLowerCase();
  if (['true', 'yes', 'y', '1'].includes(normalized)) return { value: true };
  if (['false', 'no', 'n', '0'].includes(normalized)) return { value: false };
  return { error: 'Use true/false, yes/no, or 1/0.' };
}

function sourceRow(source, index) {
  const raw = source && typeof source === 'object' && !Array.isArray(source) ? source : {};
  const rowNumber = Number.isInteger(raw.rowNumber) && raw.rowNumber > 1 ? raw.rowNumber : index + 2;
  const values = { ...raw };
  delete values.rowNumber;
  return { rowNumber, raw, values };
}

/** Validate rows and check school-specific constraints without writing data. */
export async function previewStudentImport(user, rows) {
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > MAX_IMPORT_ROWS) {
    throw new AppError({ status: 422, code: 'STUDENT_IMPORT_SIZE', message: `Import between 1 and ${MAX_IMPORT_ROWS} students per batch.` });
  }

  const db = getPrisma();
  const entries = rows.map(sourceRow);
  const emails = [...new Set(entries
    .map(({ values }) => String(values.classTeacherEmail ?? '').trim().toLowerCase())
    .filter(Boolean))];
  const teachers = emails.length
    ? await db.user.findMany({
        where: { schoolId: user.schoolId, role: 'TEACHER', isActive: true, email: { in: emails } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const teacherByEmail = new Map(teachers.map((teacher) => [teacher.email.toLowerCase(), teacher]));

  const checked = entries.map(({ rowNumber, raw, values: input }) => {
    const errors = [];
    if (!Object.keys(input).length) {
      errors.push({ field: 'row', message: 'This row is empty or invalid.' });
      return { rowNumber, source: raw, values: {}, errors, parsed: null, teacherName: null };
    }

    const teacherEmail = String(input.classTeacherEmail ?? '').trim().toLowerCase();
    const teacher = teacherEmail ? teacherByEmail.get(teacherEmail) : null;
    if (teacherEmail && !teacher) {
      errors.push({ field: 'classTeacherEmail', message: 'No active teacher with this email exists in the school.' });
    }

    const barrier = normalizeBoolean(input.financialBarrierReported);
    if (barrier.error) errors.push({ field: 'financialBarrierReported', message: barrier.error });
    const studentInput = {
      ...input,
      financialBarrierReported: barrier.value,
      assignedTeacherId: teacher?.id ?? null,
    };
    delete studentInput.classTeacherEmail;
    const result = createStudentSchema.safeParse(studentInput);
    if (!result.success) errors.push(...zodIssuesToDetails(result.error.issues));
    const parsed = result.success ? result.data : null;
    const displayValues = {
      ...(parsed ?? input),
      classTeacherEmail: teacherEmail,
      classTeacherName: teacher?.name ?? null,
    };
    return { rowNumber, source: raw, values: displayValues, errors, parsed, teacherName: teacher?.name ?? null };
  });

  const codeGroups = new Map();
  checked.forEach((entry) => {
    const code = entry.parsed?.studentCode ?? String(entry.values.studentCode ?? '').trim().toUpperCase();
    if (code) codeGroups.set(code, (codeGroups.get(code) || 0) + 1);
  });
  checked.forEach((entry) => {
    const code = entry.parsed?.studentCode ?? String(entry.values.studentCode ?? '').trim().toUpperCase();
    if (code && codeGroups.get(code) > 1) {
      entry.errors.push({ field: 'studentCode', message: 'This student code appears more than once in the CSV.' });
    }
  });

  const codes = [...codeGroups.keys()];
  if (codes.length) {
    const existing = await db.student.findMany({
      where: { schoolId: user.schoolId, studentCode: { in: codes } },
      select: { studentCode: true },
    });
    const existingCodes = new Set(existing.map((student) => student.studentCode.toUpperCase()));
    checked.forEach((entry) => {
      const code = entry.parsed?.studentCode;
      if (code && existingCodes.has(code)) {
        entry.errors.push({ field: 'studentCode', message: 'This code is already used by a student in this school.' });
      }
    });
  }

  const resultRows = checked.map(({ rowNumber, values, errors }) => ({ rowNumber, values, errors }));
  const errorCount = resultRows.reduce((sum, row) => sum + row.errors.length, 0);
  return {
    rows: resultRows,
    validCount: resultRows.filter((row) => row.errors.length === 0).length,
    errorCount,
  };
}

/** Recheck and create the whole batch atomically; partial imports are avoided. */
export async function importStudents(user, rows) {
  const preview = await previewStudentImport(user, rows);
  if (preview.errorCount) {
    throw new AppError({
      status: 422,
      code: 'STUDENT_IMPORT_INVALID',
      message: 'The preview is no longer valid. Review the row errors and preview again.',
      details: preview.rows.flatMap((row) => row.errors.map((error) => ({
        field: `row ${row.rowNumber} ${error.field}`,
        message: error.message,
      }))),
    });
  }

  const db = getPrisma();
  const data = preview.rows.map(({ values }) => {
    const input = { ...values };
    delete input.classTeacherEmail;
    delete input.classTeacherName;
    const parsed = createStudentSchema.parse(input);
    const rowData = { ...parsed, schoolId: user.schoolId, status: 'ACTIVE' };
    rowData.dateOfBirth = toDbDate(rowData.dateOfBirth);
    rowData.admissionDate = toDbDate(rowData.admissionDate);
    return rowData;
  });

  let created;
  try {
    created = await db.$transaction(async (tx) => {
      await tx.student.createMany({ data });
      const students = await tx.student.findMany({
        where: { schoolId: user.schoolId, studentCode: { in: data.map((row) => row.studentCode) } },
        select: { id: true, studentCode: true, fullName: true },
      });
      await recalculateMany(students.map((student) => student.id), { db: tx });
      return students;
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      throw new AppError({ status: 409, code: 'DUPLICATE_STUDENT_CODE', message: 'A student code was added by someone else. Preview the CSV again.' });
    }
    throw error;
  }

  return { imported: created.length, students: created };
}
