import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

import app from '../src/app.js';
import { getPrisma, disconnectPrisma } from '../src/config/prisma.js';
import { toDbDate } from '../src/utils/dates.js';
import { hasTestDatabase, resetDatabase, createSchool, createUser, TEST_PASSWORD } from './helpers/db.js';

const api = () => request(app);
const as = (token) => ({ Authorization: `Bearer ${token}` });
const login = async (email) => (await api().post('/api/v1/auth/login').send({ email, password: TEST_PASSWORD })).body.data.token;

/** Weekdays going back from `end` (inclusive), newest first. */
function schoolDays(end, count) {
  const days = [];
  const d = new Date(`${end}T00:00:00Z`);
  while (days.length < count) {
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) days.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return days;
}

describe.skipIf(!hasTestDatabase)('students, attendance, assessments and marks (database)', () => {
  const t = {};
  const db = () => getPrisma();

  beforeAll(async () => {
    await resetDatabase();
    t.school = await createSchool('AAA', 'School A');
    t.other = await createSchool('BBB', 'School B');
    t.admin = await createUser(t.school, { email: 'admin@a.test', role: 'SCHOOL_ADMIN', name: 'Admin A' });
    t.principal = await createUser(t.school, { email: 'principal@a.test', role: 'PRINCIPAL' });
    t.teacher = await createUser(t.school, { email: 'teacher@a.test', role: 'TEACHER', name: 'Teacher A' });
    t.teacher2 = await createUser(t.school, { email: 'teacher2@a.test', role: 'TEACHER' });
    t.otherAdmin = await createUser(t.other, { email: 'admin@b.test', role: 'SCHOOL_ADMIN' });

    const mk = (school, data) => db().student.create({ data: { schoolId: school.id, grade: '8', section: 'A', ...data } });
    t.asha = await mk(t.school, { studentCode: 'A-001', fullName: 'Asha Kumar', assignedTeacherId: t.teacher.id, admissionDate: toDbDate('2025-06-01') });
    t.bilal = await mk(t.school, { studentCode: 'A-002', fullName: 'Bilal Shah', assignedTeacherId: t.teacher.id });
    t.chitra = await mk(t.school, { studentCode: 'A-003', fullName: 'Chitra Rao', assignedTeacherId: t.teacher2.id });
    t.late = await mk(t.school, { studentCode: 'A-004', fullName: 'Late Joiner', assignedTeacherId: t.teacher.id, admissionDate: toDbDate('2026-10-20') });
    t.foreign = await mk(t.other, { studentCode: 'B-001', fullName: 'Other School Kid' });

    t.adminToken = await login('admin@a.test');
    t.principalToken = await login('principal@a.test');
    t.teacherToken = await login('teacher@a.test');
    t.otherToken = await login('admin@b.test');
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  /* ------------------------------------------------------------------------ */
  describe('students', () => {
    it('admins see every student in their school only', async () => {
      const res = await api().get('/api/v1/students?limit=50').set(as(t.adminToken));
      expect(res.status).toBe(200);
      expect(res.body.data.students.map((s) => s.studentCode)).toEqual(['A-001', 'A-002', 'A-003', 'A-004']);
      expect(res.body.data.total).toBe(4);
    });

    it('teachers see only their assigned students', async () => {
      const res = await api().get('/api/v1/students').set(as(t.teacherToken));
      expect(res.body.data.students.map((s) => s.fullName)).toEqual(['Asha Kumar', 'Bilal Shah', 'Late Joiner']);
      expect((await api().get(`/api/v1/students/${t.chitra.id}`).set(as(t.teacherToken))).status).toBe(404);
    });

    it("another school's student id is not found", async () => {
      expect((await api().get(`/api/v1/students/${t.foreign.id}`).set(as(t.adminToken))).status).toBe(404);
      expect((await api().get(`/api/v1/students/${t.asha.id}/summary`).set(as(t.otherToken))).status).toBe(404);
    });

    it('creates a student, rejecting duplicate codes and invalid fields', async () => {
      const ok = await api().post('/api/v1/students').set(as(t.principalToken)).send({
        studentCode: 'a-010', fullName: '  Dev   Patel ', grade: '7', section: '', guardianPhone: '98765 43210', financialBarrierReported: false,
      });
      expect(ok.status).toBe(201);
      expect(ok.body.data).toMatchObject({ studentCode: 'A-010', fullName: 'Dev Patel', section: null, guardianPhone: '9876543210', status: 'ACTIVE' });

      const dup = await api().post('/api/v1/students').set(as(t.adminToken)).send({ studentCode: 'A-010', fullName: 'Someone Else', grade: '7' });
      expect(dup.status).toBe(409);
      expect(dup.body.error.code).toBe('DUPLICATE_STUDENT_CODE');

      const bad = await api().post('/api/v1/students').set(as(t.adminToken)).send({ studentCode: 'x', fullName: 'A', grade: '13', dateOfBirth: '2999-01-01', guardianPhone: '123' });
      expect(bad.status).toBe(422);
      expect(bad.body.error.details.map((d) => d.field).sort()).toEqual(['dateOfBirth', 'fullName', 'grade', 'guardianPhone', 'studentCode']);

      expect((await api().post('/api/v1/students').set(as(t.teacherToken)).send({ studentCode: 'A-011', fullName: 'No Way', grade: '7' })).status).toBe(403);
    });

    it('lets the same student code exist in another school', async () => {
      const res = await api().post('/api/v1/students').set(as(t.otherToken)).send({ studentCode: 'A-001', fullName: 'Different Asha', grade: '5' });
      expect(res.status).toBe(201);
    });

    it('only accepts an active teacher from the same school as class teacher', async () => {
      const bad = await api().patch(`/api/v1/students/${t.bilal.id}`).set(as(t.adminToken)).send({ assignedTeacherId: t.principal.id });
      expect(bad.status).toBe(422);
      expect(bad.body.error.details[0].field).toBe('assignedTeacherId');
      const ok = await api().patch(`/api/v1/students/${t.bilal.id}`).set(as(t.adminToken)).send({ assignedTeacherId: t.teacher.id });
      expect(ok.body.data.assignedTeacherName).toBe('Teacher A');
    });

    it('teachers can update contact and support details but not enrolment', async () => {
      const ok = await api().patch(`/api/v1/students/${t.asha.id}`).set(as(t.teacherToken)).send({ guardianName: 'Meena Kumar', supportNotes: 'Walks 3 km to school.' });
      expect(ok.status).toBe(200);
      expect(ok.body.data.guardianName).toBe('Meena Kumar');
      const no = await api().patch(`/api/v1/students/${t.asha.id}`).set(as(t.teacherToken)).send({ grade: '9' });
      expect(no.status).toBe(403);
      expect((await api().patch(`/api/v1/students/${t.asha.id}`).set(as(t.teacherToken)).send({ hacked: true })).status).toBe(422);
    });

    it('recalculates risk when the financial-barrier flag changes, and drops it for inactive students', async () => {
      const on = await api().patch(`/api/v1/students/${t.bilal.id}`).set(as(t.adminToken)).send({ financialBarrierReported: true });
      expect(on.body.data.riskScore).toBe(10);
      expect(on.body.data.riskDataStatus).toBe('PROVISIONAL');

      const off = await api().patch(`/api/v1/students/${t.bilal.id}/status`).set(as(t.adminToken)).send({ status: 'TRANSFERRED' });
      expect(off.body.data).toMatchObject({ status: 'TRANSFERRED', riskScore: null });
      expect(await db().riskAssessment.count({ where: { studentId: t.bilal.id } })).toBe(0);
      expect((await api().patch(`/api/v1/students/${t.bilal.id}/status`).set(as(t.principalToken)).send({ status: 'ACTIVE' })).status).toBe(403);
      await api().patch(`/api/v1/students/${t.bilal.id}/status`).set(as(t.adminToken)).send({ status: 'ACTIVE' });
    });
  });

  /* ------------------------------------------------------------------------ */
  describe('attendance', () => {
    const days = schoolDays('2026-10-30', 6); // newest first

    it('records one entry and rejects a duplicate or future date', async () => {
      const ok = await api().post('/api/v1/attendance').set(as(t.teacherToken)).send({ studentId: t.asha.id, date: days[5], status: 'PRESENT' });
      expect(ok.status).toBe(201);
      expect(ok.body.data).toMatchObject({ date: days[5], status: 'PRESENT', recordedByName: 'Teacher A', studentName: 'Asha Kumar' });

      const dup = await api().post('/api/v1/attendance').set(as(t.adminToken)).send({ studentId: t.asha.id, date: days[5], status: 'ABSENT' });
      expect(dup.status).toBe(409);
      expect(dup.body.error.code).toBe('DUPLICATE_ATTENDANCE');

      const future = await api().post('/api/v1/attendance').set(as(t.adminToken)).send({ studentId: t.asha.id, date: '2999-01-01', status: 'PRESENT' });
      expect(future.status).toBe(422);
      expect(future.body.error.details[0].field).toBe('date');
    });

    it('teachers cannot mark students outside their scope', async () => {
      const res = await api().post('/api/v1/attendance').set(as(t.teacherToken)).send({ studentId: t.chitra.id, date: days[5], status: 'PRESENT' });
      expect(res.status).toBe(404);
      const bulk = await api().post('/api/v1/attendance/bulk').set(as(t.teacherToken)).send({ date: days[4], entries: [{ studentId: t.chitra.id, status: 'PRESENT' }] });
      expect(bulk.status).toBe(422);
    });

    it('saves a register: creates missing records and updates changed ones', async () => {
      const first = await api().post('/api/v1/attendance/bulk').set(as(t.adminToken)).send({
        date: days[4],
        entries: [
          { studentId: t.asha.id, status: 'ABSENT' },
          { studentId: t.chitra.id, status: 'LATE', note: 'Bus delay' },
        ],
      });
      expect(first.status).toBe(200);
      expect(first.body.data).toMatchObject({ created: 2, updated: 0 });

      const second = await api().post('/api/v1/attendance/bulk').set(as(t.adminToken)).send({
        date: days[4],
        entries: [
          { studentId: t.asha.id, status: 'ABSENT' },
          { studentId: t.chitra.id, status: 'PRESENT' },
        ],
      });
      expect(second.body.data).toMatchObject({ created: 0, updated: 1 });
    });

    it("teachers cannot correct someone else's entry; principals can", async () => {
      const reg = await api().get(`/api/v1/attendance/register?date=${days[4]}&grade=8&section=A`).set(as(t.teacherToken));
      expect(reg.status).toBe(200);
      const ashaRow = reg.body.data.students.find((r) => r.student.id === t.asha.id);
      expect(ashaRow.record).toMatchObject({ status: 'ABSENT', recordedByName: 'Admin A' });
      expect(reg.body.data.students.map((r) => r.student.fullName)).not.toContain('Chitra Rao');

      const patch = await api().patch(`/api/v1/attendance/${ashaRow.record.id}`).set(as(t.teacherToken)).send({ status: 'PRESENT' });
      expect(patch.status).toBe(403);
      const bulk = await api().post('/api/v1/attendance/bulk').set(as(t.teacherToken)).send({ date: days[4], entries: [{ studentId: t.asha.id, status: 'PRESENT' }] });
      expect(bulk.status).toBe(403);
      const principal = await api().patch(`/api/v1/attendance/${ashaRow.record.id}`).set(as(t.principalToken)).send({ note: 'Called home' });
      expect(principal.status).toBe(200);
      expect(principal.body.data.note).toBe('Called home');
    });

    it('updates the risk indicator from absence streaks', async () => {
      await api().post('/api/v1/attendance/bulk').set(as(t.teacherToken)).send({ date: days[3], entries: [{ studentId: t.asha.id, status: 'ABSENT' }] });
      await api().post('/api/v1/attendance/bulk').set(as(t.teacherToken)).send({ date: days[2], entries: [{ studentId: t.asha.id, status: 'ABSENT' }] });
      const student = await api().get(`/api/v1/students/${t.asha.id}`).set(as(t.teacherToken));
      // 1 present, 3 absent (streak of 3) → attendance 25% (+30) and streak 3 (+15)
      expect(student.body.data).toMatchObject({ attendanceRate: 25, riskScore: 45, riskCategory: 'MEDIUM' });
    });

    it('only school admins can delete, with a reason that is audited', async () => {
      const list = await api().get(`/api/v1/attendance?studentId=&date=${days[2]}`).set(as(t.adminToken));
      const record = list.body.data.records.find((r) => r.studentId === t.asha.id);

      expect((await api().delete(`/api/v1/attendance/${record.id}`).set(as(t.principalToken)).send({ reason: 'Entered twice' })).status).toBe(403);
      expect((await api().delete(`/api/v1/attendance/${record.id}`).set(as(t.adminToken)).send({ reason: 'no' })).status).toBe(422);

      const del = await api().delete(`/api/v1/attendance/${record.id}`).set(as(t.adminToken)).send({ reason: 'Marked on the wrong day' });
      expect(del.status).toBe(200);
      const log = await db().auditLog.findFirst({ where: { entityId: record.id } });
      expect(log).toMatchObject({ action: 'ATTENDANCE_DELETED', reason: 'Marked on the wrong day', actorId: t.admin.id });
      expect(log.details).toMatchObject({ studentId: t.asha.id, status: 'ABSENT', date: days[2] });
      expect((await api().get(`/api/v1/students/${t.asha.id}`).set(as(t.adminToken))).body.data.riskScore).toBe(30);
    });

    it('returns an overview and a student history', async () => {
      const ov = await api().get(`/api/v1/attendance/overview?from=${days[5]}&to=${days[0]}`).set(as(t.adminToken));
      expect(ov.status).toBe(200);
      expect(ov.body.data).toMatchObject({ activeStudents: 5, period: { from: days[5], to: days[0] } });
      expect(ov.body.data.classRates.length).toBeGreaterThan(0);

      const hist = await api().get(`/api/v1/attendance/student/${t.asha.id}`).set(as(t.teacherToken));
      expect(hist.body.data.summary).toMatchObject({ present: 1, absent: 2 });
      expect(hist.body.data.records[0].date > hist.body.data.records[1].date).toBe(true);
      expect((await api().get(`/api/v1/attendance/student/${t.chitra.id}`).set(as(t.teacherToken))).status).toBe(404);
    });
  });

  /* ------------------------------------------------------------------------ */
  describe('assessments and marks', () => {
    it("teachers can create assessments only for their students' classes", async () => {
      const ok = await api().post('/api/v1/assessments').set(as(t.teacherToken)).send({
        title: 'Unit Test 1', subject: 'Mathematics', grade: '8', section: 'A', assessmentDate: '2026-09-15', maxMarks: 25,
      });
      expect(ok.status).toBe(201);
      t.ut1 = ok.body.data;
      expect(t.ut1).toMatchObject({ createdByName: 'Teacher A', classSize: 2, marksCount: 0 }); // Late Joiner joined after the test

      const no = await api().post('/api/v1/assessments').set(as(t.teacherToken)).send({
        title: 'Unit Test 1', subject: 'Mathematics', grade: '5', section: 'A', assessmentDate: '2026-09-15', maxMarks: 25,
      });
      expect(no.status).toBe(422);

      const ut2 = await api().post('/api/v1/assessments').set(as(t.adminToken)).send({
        title: 'Unit Test 2', subject: 'Mathematics', grade: '8', section: 'A', assessmentDate: '2026-10-25', maxMarks: 50,
      });
      t.ut2 = ut2.body.data;
      expect(ut2.body.data.classSize).toBe(4); // admin sees the whole class, including the late joiner
    });

    it('validates scores against the maximum, all or nothing', async () => {
      const res = await api().post('/api/v1/marks/bulk').set(as(t.adminToken)).send({
        assessmentId: t.ut1.id,
        entries: [
          { studentId: t.asha.id, score: 20 },
          { studentId: t.chitra.id, score: 30 },
        ],
      });
      expect(res.status).toBe(422);
      expect(res.body.error.details).toEqual([{ field: `score.${t.chitra.id}`, message: 'Score cannot be more than 25.' }]);
      expect(await db().studentMark.count()).toBe(0);
    });

    it('saves marks, then recalculates academic decline', async () => {
      const ut1 = await api().post('/api/v1/marks/bulk').set(as(t.adminToken)).send({
        assessmentId: t.ut1.id,
        entries: [{ studentId: t.asha.id, score: 20 }, { studentId: t.chitra.id, score: 22.5 }],
      });
      expect(ut1.body.data).toEqual({ created: 2, updated: 0 });

      const ut2 = await api().post('/api/v1/marks/bulk').set(as(t.teacherToken)).send({
        assessmentId: t.ut2.id,
        entries: [{ studentId: t.asha.id, score: 25 }], // 80% → 50%: a 30-point drop
      });
      expect(ut2.body.data).toEqual({ created: 1, updated: 0 });
      const asha = (await api().get(`/api/v1/students/${t.asha.id}/summary`).set(as(t.teacherToken))).body.data;
      expect(asha.risk.reasons.map((r) => r.code)).toContain('ACADEMIC_DECLINE_20_PLUS');
      expect(asha.academics).toMatchObject({ assessmentsRecorded: 2, averagePercentage: 65 });

      const again = await api().post('/api/v1/marks/bulk').set(as(t.adminToken)).send({
        assessmentId: t.ut1.id,
        entries: [{ studentId: t.asha.id, score: 20 }, { studentId: t.chitra.id, score: 23 }],
      });
      expect(again.body.data).toEqual({ created: 0, updated: 1 });
    });

    it('teachers cannot enter marks for students outside their scope', async () => {
      const res = await api().post('/api/v1/marks/bulk').set(as(t.teacherToken)).send({ assessmentId: t.ut2.id, entries: [{ studentId: t.chitra.id, score: 30 }] });
      expect(res.status).toBe(422);
      expect(res.body.error.details[0].message).toBe('Student not found.');
    });

    it('shows a marks sheet of the class on the assessment date', async () => {
      const res = await api().get(`/api/v1/assessments/${t.ut1.id}`).set(as(t.adminToken));
      expect(res.status).toBe(200);
      expect(res.body.data.students.map((r) => r.student.fullName)).toEqual(['Asha Kumar', 'Bilal Shah', 'Chitra Rao']);
      expect(res.body.data.students[0].mark).toMatchObject({ score: 20, percentage: 80 });
      expect(res.body.data.students[1].mark).toBeNull();
      expect(res.body.data.assessment).toMatchObject({ marksCount: 2, missingMarks: 1, averagePercentage: 86 });
    });

    it('lists assessments and the overview', async () => {
      const list = await api().get('/api/v1/assessments?subject=Mathematics').set(as(t.teacherToken));
      expect(list.body.data.assessments.map((a) => a.title)).toEqual(['Unit Test 2', 'Unit Test 1']);
      const ov = await api().get('/api/v1/assessments/overview').set(as(t.adminToken));
      expect(ov.body.data.declining[0]).toMatchObject({ studentName: 'Asha Kumar', subject: 'Mathematics', drop: 30 });
    });

    it('keeps assessments isolated by school', async () => {
      expect((await api().get(`/api/v1/assessments/${t.ut1.id}`).set(as(t.otherToken))).status).toBe(404);
      const res = await api().post('/api/v1/marks/bulk').set(as(t.otherToken)).send({ assessmentId: t.ut1.id, entries: [{ studentId: t.foreign.id, score: 1 }] });
      expect(res.status).toBe(404);
    });

    it('records and corrects a single mark, with 409 for duplicates', async () => {
      const ok = await api().post('/api/v1/marks').set(as(t.teacherToken)).send({ studentId: t.bilal.id, assessmentId: t.ut1.id, score: '12' });
      expect(ok.status).toBe(201);
      expect((await api().post('/api/v1/marks').set(as(t.teacherToken)).send({ studentId: t.bilal.id, assessmentId: t.ut1.id, score: 13 })).status).toBe(409);
      const fix = await api().patch(`/api/v1/marks/${ok.body.data.id}`).set(as(t.teacherToken)).send({ score: 26 });
      expect(fix.status).toBe(422);
      expect((await api().patch(`/api/v1/marks/${ok.body.data.id}`).set(as(t.teacherToken)).send({ score: 14 })).body.data.score).toBe(14);
      t.bilalMark = ok.body.data.id;
    });

    it('protects assessments that have marks', async () => {
      const del = await api().delete(`/api/v1/assessments/${t.ut1.id}`).set(as(t.adminToken));
      expect(del.status).toBe(409);
      expect(del.body.error.code).toBe('ASSESSMENT_HAS_MARKS');
      const shrink = await api().patch(`/api/v1/assessments/${t.ut1.id}`).set(as(t.adminToken)).send({ maxMarks: 20 });
      expect(shrink.status).toBe(422);
      const notCreator = await api().patch(`/api/v1/assessments/${t.ut2.id}`).set(as(t.teacherToken)).send({ title: 'Renamed' });
      expect(notCreator.status).toBe(403);
    });

    it('lets admins delete a mark with an audited reason', async () => {
      expect((await api().delete(`/api/v1/marks/${t.bilalMark}`).set(as(t.teacherToken)).send({ reason: 'Wrong student' })).status).toBe(403);
      expect((await api().delete(`/api/v1/marks/${t.bilalMark}`).set(as(t.adminToken)).send({ reason: 'Wrong student' })).status).toBe(200);
      expect(await db().auditLog.count({ where: { action: 'MARK_DELETED', entityId: t.bilalMark } })).toBe(1);
    });
  });
});
