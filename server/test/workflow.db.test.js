import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

import app from '../src/app.js';
import { getPrisma, disconnectPrisma } from '../src/config/prisma.js';
import { toDbDate, schoolToday, addDays } from '../src/utils/dates.js';
import { recalculateMany } from '../src/services/risk.service.js';
import { hasTestDatabase, resetDatabase, createSchool, createUser, TEST_PASSWORD } from './helpers/db.js';

const api = () => request(app);
const as = (token) => ({ Authorization: `Bearer ${token}` });
const login = async (email) => (await api().post('/api/v1/auth/login').send({ email, password: TEST_PASSWORD })).body.data.token;

describe.skipIf(!hasTestDatabase)('risk, interventions and dashboard (database)', () => {
  const t = {};
  const db = () => getPrisma();
  const today = schoolToday();

  /** `count` attendance records ending yesterday, newest first, using `statuses` in order. */
  async function addAttendance(student, statuses, recordedById) {
    await db().attendance.createMany({
      data: statuses.map((status, i) => ({
        schoolId: student.schoolId,
        studentId: student.id,
        date: toDbDate(addDays(today, -(i + 1))),
        status,
        recordedById,
      })),
    });
  }

  beforeAll(async () => {
    await resetDatabase();
    t.school = await createSchool('AAA', 'School A');
    t.other = await createSchool('BBB', 'School B');
    t.admin = await createUser(t.school, { email: 'admin@a.test', role: 'SCHOOL_ADMIN', name: 'Admin A' });
    t.principal = await createUser(t.school, { email: 'principal@a.test', role: 'PRINCIPAL', name: 'Principal A' });
    t.teacher = await createUser(t.school, { email: 'teacher@a.test', role: 'TEACHER', name: 'Teacher A' });
    t.teacher2 = await createUser(t.school, { email: 'teacher2@a.test', role: 'TEACHER', name: 'Teacher B' });
    t.gone = await createUser(t.school, { email: 'gone@a.test', role: 'TEACHER', isActive: false });
    t.otherAdmin = await createUser(t.other, { email: 'admin@b.test', role: 'SCHOOL_ADMIN' });

    const mk = (data) => db().student.create({ data: { schoolId: t.school.id, grade: '8', section: 'A', ...data } });
    t.asha = await mk({ studentCode: 'A-001', fullName: 'Asha Kumar', assignedTeacherId: t.teacher.id });
    t.bilal = await mk({ studentCode: 'A-002', fullName: 'Bilal Shah', assignedTeacherId: t.teacher.id, financialBarrierReported: true });
    t.chitra = await mk({ studentCode: 'A-003', fullName: 'Chitra Rao', assignedTeacherId: t.teacher2.id });
    t.foreign = await db().student.create({ data: { schoolId: t.other.id, grade: '8', studentCode: 'B-001', fullName: 'Other Kid' } });

    // Asha: 12 days, 6 absent in a row → attendance 50% (+30) and streak 6 (+25) = 55 HIGH.
    await addAttendance(t.asha, [...Array(6).fill('ABSENT'), ...Array(6).fill('PRESENT')], t.teacher.id);
    // Chitra: 12 days, all present → 0 LOW (provisional: no marks).
    await addAttendance(t.chitra, Array(12).fill('PRESENT'), t.teacher2.id);
    await recalculateMany([t.asha.id, t.bilal.id, t.chitra.id, t.foreign.id]);

    t.adminToken = await login('admin@a.test');
    t.principalToken = await login('principal@a.test');
    t.teacherToken = await login('teacher@a.test');
    t.teacher2Token = await login('teacher2@a.test');
    t.otherToken = await login('admin@b.test');
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  /* ------------------------------------------------------------------------ */
  describe('risk', () => {
    it('lists flags highest first, with reasons and review state', async () => {
      const res = await api().get('/api/v1/risk').set(as(t.adminToken));
      expect(res.status).toBe(200);
      const [first, second, third] = res.body.data.assessments;
      expect(first).toMatchObject({ score: 55, category: 'HIGH', needsReview: true, student: { fullName: 'Asha Kumar' } });
      expect(first.reasons.map((r) => r.code)).toEqual(['LOW_ATTENDANCE', 'ABSENCE_STREAK_5_PLUS']);
      expect(second).toMatchObject({ score: 10, category: 'LOW', dataStatus: 'PROVISIONAL', student: { fullName: 'Bilal Shah' } });
      expect(third).toMatchObject({ score: 0, student: { fullName: 'Chitra Rao' } });
    });

    it('limits teachers to their students and other schools to nothing', async () => {
      const res = await api().get('/api/v1/risk').set(as(t.teacherToken));
      expect(res.body.data.assessments.map((a) => a.student.fullName)).toEqual(['Asha Kumar', 'Bilal Shah']);
      expect((await api().get(`/api/v1/risk/${t.chitra.id}`).set(as(t.teacherToken))).status).toBe(404);
      expect((await api().get(`/api/v1/risk/${t.asha.id}`).set(as(t.otherToken))).status).toBe(404);
    });

    it('records a review with a note, which clears "awaiting review"', async () => {
      const short = await api().post(`/api/v1/risk/${t.asha.id}/review`).set(as(t.teacherToken)).send({ note: 'ok' });
      expect(short.status).toBe(422);
      const res = await api().post(`/api/v1/risk/${t.asha.id}/review`).set(as(t.teacherToken)).send({ note: 'Called mother: Asha was ill, back on Monday.' });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ needsReview: false, reviewedByName: 'Teacher A', reviewNote: 'Called mother: Asha was ill, back on Monday.' });
      const ov = await api().get('/api/v1/risk/overview').set(as(t.adminToken));
      expect(ov.body.data).toMatchObject({ counts: { HIGH: 1, MEDIUM: 0, LOW: 2, INSUFFICIENT_DATA: 0 }, awaitingReview: 0, provisional: 3 });
    });

    it('recalculates one student, and all students for admins and principals only', async () => {
      const one = await api().post(`/api/v1/risk/recalculate/${t.asha.id}`).set(as(t.teacherToken));
      expect(one.body.data).toMatchObject({ assessment: { score: 55 }, previous: { score: 55, category: 'HIGH' } });
      expect((await api().post('/api/v1/risk/recalculate').set(as(t.teacherToken))).status).toBe(403);
      const all = await api().post('/api/v1/risk/recalculate').set(as(t.principalToken));
      expect(all.body.data).toEqual({ processed: 3, changed: 0 });
    });
  });

  /* ------------------------------------------------------------------------ */
  describe('interventions', () => {
    const base = () => ({
      studentId: t.asha.id,
      category: 'ATTENDANCE',
      priority: 'HIGH',
      description: 'Absent six days in a row with no message from home.',
      actionPlan: 'Call the guardian today.',
      assignedToId: t.teacher.id,
      dueDate: addDays(today, 3),
      followUpDate: addDays(today, 10),
    });

    it('validates with the shared rules', async () => {
      const res = await api().post('/api/v1/interventions').set(as(t.adminToken)).send({ ...base(), description: 'short', dueDate: '', followUpDate: addDays(today, 1) });
      expect(res.status).toBe(422);
      expect(res.body.error.details.map((d) => d.field).sort()).toEqual(['description', 'dueDate']);

      const before = await api().post('/api/v1/interventions').set(as(t.adminToken)).send({ ...base(), followUpDate: addDays(today, 1) });
      expect(before.body.error.details).toEqual([{ field: 'followUpDate', message: 'The follow-up date cannot be before the due date.' }]);

      const inactiveOwner = await api().post('/api/v1/interventions').set(as(t.adminToken)).send({ ...base(), assignedToId: t.gone.id });
      expect(inactiveOwner.status).toBe(422);
      expect(inactiveOwner.body.error.details[0].field).toBe('assignedToId');
    });

    it('creates an intervention with a risk snapshot and a history entry', async () => {
      const res = await api().post('/api/v1/interventions').set(as(t.teacherToken)).send(base());
      expect(res.status).toBe(201);
      t.int1 = res.body.data;
      expect(t.int1).toMatchObject({
        status: 'OPEN',
        isOpen: true,
        isOverdue: false,
        assignedToName: 'Teacher A',
        createdByName: 'Teacher A',
        riskSnapshot: { score: 55, category: 'HIGH' },
        student: { fullName: 'Asha Kumar' },
      });
      expect(t.int1.history).toEqual([expect.objectContaining({ type: 'CREATED', byName: 'Teacher A' })]);
    });

    it("can't be created for students outside the user's scope", async () => {
      expect((await api().post('/api/v1/interventions').set(as(t.teacherToken)).send({ ...base(), studentId: t.chitra.id })).status).toBe(404);
      expect((await api().post('/api/v1/interventions').set(as(t.adminToken)).send({ ...base(), studentId: t.foreign.id })).status).toBe(404);
    });

    it('only the creator, owner, principal or admin can change it', async () => {
      const outsider = await api().patch(`/api/v1/interventions/${t.int1.id}`).set(as(t.teacher2Token)).send({ note: 'Checking in' });
      expect(outsider.status).toBe(404); // not visible to teacher2 at all

      // Reassign to teacher2: now teacher2 owns it and can see and update it.
      const reassign = await api().patch(`/api/v1/interventions/${t.int1.id}`).set(as(t.principalToken)).send({ assignedToId: t.teacher2.id, priority: 'MEDIUM' });
      expect(reassign.status).toBe(200);
      expect(reassign.body.data.assignedToName).toBe('Teacher B');
      expect(reassign.body.data.history.map((e) => e.type)).toEqual(['CREATED', 'REASSIGNED', 'UPDATED']);
      expect(reassign.body.data.history[2].fields).toEqual(['priority']);

      const note = await api().patch(`/api/v1/interventions/${t.int1.id}`).set(as(t.teacher2Token)).send({ note: 'Spoke with Asha at lunch.' });
      expect(note.body.data.history.at(-1)).toMatchObject({ type: 'NOTE', byName: 'Teacher B', note: 'Spoke with Asha at lunch.' });
    });

    it('needs an outcome to complete and a reason to reopen; closed plans are locked', async () => {
      const url = `/api/v1/interventions/${t.int1.id}/status`;
      expect((await api().patch(url).set(as(t.teacherToken)).send({ status: 'IN_PROGRESS' })).status).toBe(200); // creator
      const noOutcome = await api().patch(url).set(as(t.teacherToken)).send({ status: 'COMPLETED' });
      expect(noOutcome.status).toBe(422);
      expect(noOutcome.body.error.details[0].field).toBe('outcome');

      const done = await api().patch(url).set(as(t.teacherToken)).send({ status: 'COMPLETED', outcome: 'Back at school every day this week.' });
      expect(done.body.data).toMatchObject({ status: 'COMPLETED', isOpen: false, outcome: 'Back at school every day this week.' });

      const locked = await api().patch(`/api/v1/interventions/${t.int1.id}`).set(as(t.adminToken)).send({ priority: 'HIGH' });
      expect(locked.status).toBe(409);
      expect((await api().patch(url).set(as(t.adminToken)).send({ status: 'IN_PROGRESS' })).status).toBe(422);
      const reopened = await api().patch(url).set(as(t.adminToken)).send({ status: 'IN_PROGRESS', note: 'Absences started again.' });
      expect(reopened.body.data.history.at(-1)).toMatchObject({ type: 'STATUS_CHANGED', fromStatus: 'COMPLETED', toStatus: 'IN_PROGRESS', note: 'Absences started again.' });
    });

    it('adds +10 risk while an open intervention is overdue', async () => {
      const res = await api().post('/api/v1/interventions').set(as(t.adminToken)).send({
        ...base(),
        studentId: t.bilal.id,
        category: 'FINANCIAL',
        assignedToId: t.admin.id,
        dueDate: addDays(today, -2),
        followUpDate: null,
      });
      expect(res.body.data).toMatchObject({ isOverdue: true, daysOverdue: 2 });
      t.int2 = res.body.data;
      const risk = await api().get(`/api/v1/risk/${t.bilal.id}`).set(as(t.adminToken));
      expect(risk.body.data.score).toBe(20);
      expect(risk.body.data.reasons.map((r) => r.code)).toContain('OVERDUE_INTERVENTION');
    });

    it('filters the list and summarises counts', async () => {
      const overdue = await api().get('/api/v1/interventions?due=overdue').set(as(t.adminToken));
      expect(overdue.body.data.interventions.map((i) => i.id)).toEqual([t.int2.id]);
      const mine = await api().get('/api/v1/interventions?assignedTo=me&status=active').set(as(t.teacher2Token));
      expect(mine.body.data.interventions.map((i) => i.id)).toEqual([t.int1.id]);
      const ov = await api().get('/api/v1/interventions/overview').set(as(t.adminToken));
      expect(ov.body.data).toMatchObject({ open: 2, overdue: 1, counts: { OPEN: 1, IN_PROGRESS: 1, COMPLETED: 0, CANCELLED: 0 } });
      expect((await api().get(`/api/v1/interventions/${t.int1.id}`).set(as(t.otherToken))).status).toBe(404);
    });

    it('recalculates risk on the next read once a due date passes without any change', async () => {
      // Chitra: an intervention due yesterday, and a score last calculated yesterday.
      const int = await db().intervention.create({
        data: {
          schoolId: t.school.id,
          studentId: t.chitra.id,
          createdById: t.admin.id,
          assignedToId: t.admin.id,
          category: 'OTHER',
          description: 'Check in about the school trip fee.',
          dueDate: toDbDate(addDays(today, -1)),
        },
      });
      const yesterday = new Date(Date.now() - 36 * 3600 * 1000);
      await db().riskAssessment.update({ where: { studentId: t.chitra.id }, data: { calculatedAt: yesterday, score: 0 } });

      const list = await api().get('/api/v1/risk').set(as(t.adminToken));
      const chitra = list.body.data.assessments.find((a) => a.studentId === t.chitra.id);
      expect(chitra.score).toBe(10);
      expect(chitra.reasons.map((r) => r.code)).toEqual(['OVERDUE_INTERVENTION']);
      await db().intervention.update({ where: { id: int.id }, data: { status: 'CANCELLED' } });
    });
  });

  /* ------------------------------------------------------------------------ */
  describe('dashboard', () => {
    it('gives admins and principals the whole school', async () => {
      const res = await api().get('/api/v1/dashboard/overview?days=30').set(as(t.principalToken));
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        scope: 'SCHOOL',
        activeStudents: 3,
        period: { days: 30, to: today },
        attendance: { attended: 18, eligible: 24, excused: 0, recordedDays: 12, studentsBelow75: 1, rate: 75 },
        interventions: { open: 1, inProgress: 1, overdue: 1 },
      });
      expect((await api().get('/api/v1/dashboard/overview').set(as(t.teacherToken))).status).toBe(403);
    });

    it('gives teachers their assigned students only', async () => {
      const res = await api().get('/api/v1/dashboard/teacher').set(as(t.teacherToken));
      expect(res.body.data).toMatchObject({ scope: 'ASSIGNED', activeStudents: 2 });
      expect((await api().get('/api/v1/dashboard/teacher').set(as(t.adminToken))).status).toBe(403);
    });

    it('lists follow-ups without sensitive details', async () => {
      const res = await api().get('/api/v1/dashboard/attention').set(as(t.adminToken));
      expect(res.body.data.students.map((s) => s.student.fullName)).toEqual(['Asha Kumar']);
      const followUp = res.body.data.followUps.find((f) => f.id === t.int2.id);
      expect(followUp).toMatchObject({ isOverdue: true, assignedToName: 'Admin A', student: { fullName: 'Bilal Shah' } });
      const keys = Object.keys(followUp);
      ['description', 'actionPlan', 'outcome', 'history', 'riskSnapshot'].forEach((k) => expect(keys).not.toContain(k));
    });
  });
});
