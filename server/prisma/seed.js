/**
 * Seed the Udaan demo school: staff accounts, students, attendance,
 * assessments and marks, then calculate every student's risk indicator.
 *
 *   npm run db:seed                         (from the repo root)
 *
 * The demo records come from the same files the web app's mock mode uses
 * (client/src/data), so mock mode and the seeded database tell the same story.
 *
 * Safe to run more than once: accounts and students are updated in place
 * (accounts keep their current password), and attendance, assessments and
 * marks are only added where missing. Set SEED_RESET_PASSWORDS=true to reset
 * every demo account to the demo password.
 *
 * The demo password is public (it is in the README), so never seed a
 * database that holds a real school's data.
 */
import { getPrisma, disconnectPrisma } from '../src/config/prisma.js';
import { env } from '../src/config/env.js';
import { hashPassword } from '../src/utils/passwords.js';
import { toDbDate } from '../src/utils/dates.js';
import { recalculateMany } from '../src/services/risk.service.js';
import { mockStudentsList } from '../../client/src/data/mockStudentsData.js';
import { mockAttendanceRecords } from '../../client/src/data/mockAttendanceData.js';
import { mockAssessments, mockMarks } from '../../client/src/data/mockAcademicsData.js';

export const DEMO_PASSWORD = 'Udaan@123';

export const DEMO_SCHOOL = { code: 'UDN', name: 'Udaan Demo School', address: 'Pune, Maharashtra' };

export const DEMO_STAFF = [
  { mockId: 'USR-001', email: 'admin@udaan.demo', name: 'Radhika Sharma', role: 'SCHOOL_ADMIN', isActive: true },
  { mockId: 'USR-002', email: 'principal@udaan.demo', name: 'Amit Verma', role: 'PRINCIPAL', isActive: true },
  { mockId: 'USR-003', email: 'teacher@udaan.demo', name: 'Neha Gupta', role: 'TEACHER', isActive: true },
  { mockId: 'USR-005', email: 'farhan.khan@udaan.demo', name: 'Farhan Khan', role: 'TEACHER', isActive: true },
  { mockId: 'USR-004', email: 'inactive@udaan.demo', name: 'Sandeep Patil', role: 'TEACHER', isActive: false },
];

async function main() {
  if (env.isProduction && !process.argv.includes('--allow-production')) {
    throw new Error('Refusing to seed demo accounts with NODE_ENV=production. Pass --allow-production if this is a demo database.');
  }
  const prisma = getPrisma();
  const resetPasswords = process.env.SEED_RESET_PASSWORDS === 'true';
  const demoHash = await hashPassword(DEMO_PASSWORD);

  const school = await prisma.school.upsert({
    where: { code: DEMO_SCHOOL.code },
    update: { name: DEMO_SCHOOL.name, address: DEMO_SCHOOL.address },
    create: DEMO_SCHOOL,
  });

  const results = [];
  const userIds = new Map(); // mock user id → database id
  for (const { mockId, ...staff } of DEMO_STAFF) {
    const existing = await prisma.user.findUnique({ where: { email: staff.email }, select: { id: true } });
    const user = await prisma.user.upsert({
      where: { email: staff.email },
      update: { ...staff, schoolId: school.id, ...(resetPasswords && { passwordHash: demoHash }) },
      create: { ...staff, schoolId: school.id, passwordHash: demoHash },
    });
    userIds.set(mockId, user.id);
    results.push(`${existing ? 'updated' : 'created'}  ${staff.email.padEnd(24)} ${staff.role}${staff.isActive ? '' : ' (inactive)'}`);
  }

  console.log(`School: ${school.name} (${school.code})`);
  results.forEach((line) => console.log(`  ${line}`));
  console.log(`Demo password for new accounts: ${DEMO_PASSWORD}${resetPasswords ? ' (all demo passwords reset)' : ''}`);

  const studentIds = await seedRecords(prisma, school, userIds);
  await recalculateMany([...studentIds.values()]);
  console.log(`Risk indicators calculated for ${studentIds.size} students.`);
}

/** Students, attendance, assessments and marks from the shared demo data. */
async function seedRecords(prisma, school, userIds) {
  const adminId = userIds.get('USR-001');
  const staffId = (mockId) => userIds.get(mockId) ?? adminId;

  // Students: upsert by student code (updates keep any real changes to other fields minimal).
  const studentIds = new Map(); // mock student id → database id
  for (const s of mockStudentsList) {
    const data = {
      fullName: s.fullName,
      dateOfBirth: toDbDate(s.dateOfBirth),
      grade: s.grade,
      section: s.section,
      admissionDate: toDbDate(s.admissionDate),
      status: s.status,
      guardianName: s.guardianName || null,
      guardianPhone: s.guardianPhone || null,
      guardianRelationship: s.guardianRelationship || null,
      financialBarrierReported: s.financialBarrierReported,
      supportNotes: s.supportNotes || null,
      assignedTeacherId: s.assignedTeacherId ? staffId(s.assignedTeacherId) : null,
    };
    const student = await prisma.student.upsert({
      where: { schoolId_studentCode: { schoolId: school.id, studentCode: s.studentCode } },
      update: data,
      create: { ...data, schoolId: school.id, studentCode: s.studentCode },
    });
    studentIds.set(s.id, student.id);
  }

  // Attendance: add missing days only (existing records are left as they are).
  const attendance = await prisma.attendance.createMany({
    data: mockAttendanceRecords.map((r) => ({
      schoolId: school.id,
      studentId: studentIds.get(r.studentId),
      date: toDbDate(r.date),
      status: r.status,
      note: r.note || null,
      recordedById: staffId(r.recordedById),
    })),
    skipDuplicates: true,
  });

  // Assessments: matched on title, subject, class and date.
  const assessmentIds = new Map();
  let assessmentsCreated = 0;
  for (const a of mockAssessments) {
    const key = { schoolId: school.id, title: a.title, subject: a.subject, grade: a.grade, section: a.section, assessmentDate: toDbDate(a.assessmentDate) };
    let row = await prisma.assessment.findFirst({ where: key, select: { id: true } });
    if (!row) {
      row = await prisma.assessment.create({ data: { ...key, maxMarks: a.maxMarks, createdById: staffId(a.createdById) }, select: { id: true } });
      assessmentsCreated += 1;
    }
    assessmentIds.set(a.id, row.id);
  }

  const marks = await prisma.studentMark.createMany({
    data: mockMarks.map((m) => ({
      schoolId: school.id,
      studentId: studentIds.get(m.studentId),
      assessmentId: assessmentIds.get(m.assessmentId),
      score: m.score,
      recordedById: staffId(m.recordedById),
    })),
    skipDuplicates: true,
  });

  console.log(
    `Students: ${studentIds.size} · attendance added: ${attendance.count} · assessments added: ${assessmentsCreated} · marks added: ${marks.count}`
  );
  return studentIds;
}

main()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(disconnectPrisma);
