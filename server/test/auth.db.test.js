import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

import app from '../src/app.js';
import { getPrisma, disconnectPrisma } from '../src/config/prisma.js';
import { hasTestDatabase, resetDatabase, createSchool, createUser, TEST_PASSWORD } from './helpers/db.js';

const api = () => request(app);
const login = (email, password = TEST_PASSWORD) => api().post('/api/v1/auth/login').send({ email, password });
const as = (token) => ({ Authorization: `Bearer ${token}` });

describe.skipIf(!hasTestDatabase)('auth and staff API (database)', () => {
  const t = {};

  beforeAll(async () => {
    await resetDatabase();
    t.schoolA = await createSchool('AAA', 'School A');
    t.schoolB = await createSchool('BBB', 'School B');
    t.admin = await createUser(t.schoolA, { email: 'admin@a.test', role: 'SCHOOL_ADMIN' });
    t.principal = await createUser(t.schoolA, { email: 'principal@a.test', role: 'PRINCIPAL' });
    t.teacher = await createUser(t.schoolA, { email: 'teacher@a.test', role: 'TEACHER' });
    t.inactive = await createUser(t.schoolA, { email: 'gone@a.test', isActive: false });
    t.otherAdmin = await createUser(t.schoolB, { email: 'admin@b.test', role: 'SCHOOL_ADMIN' });

    for (const key of ['admin', 'principal', 'teacher', 'otherAdmin']) {
      t[`${key}Token`] = (await login(t[key].email)).body.data.token;
    }
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  describe('POST /auth/login', () => {
    it('returns a token and the user without the password hash', async () => {
      const res = await login('ADMIN@a.test ');
      expect(res.status).toBe(200);
      expect(res.body.data.token).toEqual(expect.any(String));
      expect(res.body.data.user).toMatchObject({ email: 'admin@a.test', role: 'SCHOOL_ADMIN', schoolName: 'School A' });
      expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
    });

    it.each([
      ['wrong password', 'admin@a.test', 'nope-nope'],
      ['unknown email', 'nobody@a.test', TEST_PASSWORD],
      ['deactivated account', 'gone@a.test', TEST_PASSWORD],
    ])('gives the same generic 401 for a %s', async (_, email, password) => {
      const res = await login(email, password);
      expect(res.status).toBe(401);
      expect(res.body.error).toEqual({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.', details: [] });
    });
  });

  describe('GET /auth/me', () => {
    it('returns the signed-in user', async () => {
      const res = await api().get('/api/v1/auth/me').set(as(t.teacherToken));
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ id: t.teacher.id, role: 'TEACHER', schoolName: 'School A' });
    });

    it('stops working as soon as the account is deactivated', async () => {
      const temp = await createUser(t.schoolA, { email: 'temp@a.test' });
      const token = (await login(temp.email)).body.data.token;
      await getPrisma().user.update({ where: { id: temp.id }, data: { isActive: false } });
      expect((await api().get('/api/v1/auth/me').set(as(token))).status).toBe(401);
    });
  });

  describe('staff permissions', () => {
    it('teachers cannot list staff (403) but can list assignable owners', async () => {
      expect((await api().get('/api/v1/users').set(as(t.teacherToken))).status).toBe(403);
      const res = await api().get('/api/v1/users/assignable').set(as(t.teacherToken));
      expect(res.status).toBe(200);
      const emails = res.body.data.users.map((u) => u.id);
      expect(emails).toContain(t.admin.id);
      expect(emails).not.toContain(t.inactive.id); // inactive staff can't own work
      expect(emails).not.toContain(t.otherAdmin.id); // other schools never appear
      expect(Object.keys(res.body.data.users[0]).sort()).toEqual(['id', 'name', 'role']);
    });

    it('principals can view but not change staff', async () => {
      expect((await api().get('/api/v1/users').set(as(t.principalToken))).status).toBe(200);
      const res = await api().post('/api/v1/users').set(as(t.principalToken)).send({ name: 'X Y', email: 'x@a.test', role: 'TEACHER', password: 'Password1' });
      expect(res.status).toBe(403);
    });
  });

  describe('school isolation', () => {
    it('lists only staff from the admin\'s own school', async () => {
      const res = await api().get('/api/v1/users').set(as(t.adminToken));
      expect(res.status).toBe(200);
      expect(res.body.data.users.every((u) => u.schoolId === t.schoolA.id)).toBe(true);
      expect(res.body.data.users.map((u) => u.email)).not.toContain('admin@b.test');
    });

    it('treats another school\'s staff id as not found', async () => {
      expect((await api().get(`/api/v1/users/${t.otherAdmin.id}`).set(as(t.adminToken))).status).toBe(404);
      expect((await api().patch(`/api/v1/users/${t.otherAdmin.id}`).set(as(t.adminToken)).send({ name: 'Hacked' })).status).toBe(404);
      expect((await api().patch(`/api/v1/users/${t.otherAdmin.id}/status`).set(as(t.adminToken)).send({ isActive: false })).status).toBe(404);
    });
  });

  describe('creating and updating staff (admin)', () => {
    it('creates an account that can sign in with its temporary password', async () => {
      const res = await api().post('/api/v1/users').set(as(t.adminToken))
        .send({ name: 'Kavya Rao', email: 'Kavya@A.test', role: 'TEACHER', password: 'Welcome123' });
      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ email: 'kavya@a.test', role: 'TEACHER', isActive: true, schoolId: t.schoolA.id, assignedStudents: 0, openInterventions: 0 });
      expect((await login('kavya@a.test', 'Welcome123')).status).toBe(200);
    });

    it('rejects a duplicate email with 409 DUPLICATE_EMAIL — even from another school', async () => {
      const res = await api().post('/api/v1/users').set(as(t.adminToken))
        .send({ name: 'Copy Cat', email: 'admin@b.test', role: 'TEACHER', password: 'Welcome123' });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
      expect(res.body.error.details[0].field).toBe('email');
    });

    it('validates fields with 422 details', async () => {
      const res = await api().post('/api/v1/users').set(as(t.adminToken)).send({ name: 'A', email: 'not-an-email', role: 'PLATFORM_ADMIN', password: 'short' });
      expect(res.status).toBe(422);
      expect(res.body.error.details.map((d) => d.field).sort()).toEqual(['email', 'name', 'password', 'role']);
    });

    it('updates name and role', async () => {
      const res = await api().patch(`/api/v1/users/${t.teacher.id}`).set(as(t.adminToken)).send({ name: 'Neha G.', role: 'PRINCIPAL' });
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ name: 'Neha G.', role: 'PRINCIPAL' });
      await api().patch(`/api/v1/users/${t.teacher.id}`).set(as(t.adminToken)).send({ role: 'TEACHER' });
    });

    it('does not let admins change their own role or deactivate themselves', async () => {
      const role = await api().patch(`/api/v1/users/${t.admin.id}`).set(as(t.adminToken)).send({ role: 'TEACHER' });
      expect(role.status).toBe(422);
      expect(role.body.error.details[0].field).toBe('role');
      const self = await api().patch(`/api/v1/users/${t.admin.id}/status`).set(as(t.adminToken)).send({ isActive: false });
      expect(self.status).toBe(409);
      expect(self.body.error.code).toBe('CANNOT_DEACTIVATE_SELF');
    });

    it('lets an admin deactivate another admin, who then cannot sign in', async () => {
      const second = await createUser(t.schoolA, { email: 'admin2@a.test', role: 'SCHOOL_ADMIN' });
      const res = await api().patch(`/api/v1/users/${second.id}/status`).set(as(t.adminToken)).send({ isActive: false });
      expect(res.status).toBe(200);
      expect((await login(second.email)).status).toBe(401);
    });

    it('deactivates and reactivates a teacher', async () => {
      const off = await api().patch(`/api/v1/users/${t.teacher.id}/status`).set(as(t.adminToken)).send({ isActive: false });
      expect(off.body.data.isActive).toBe(false);
      expect((await login(t.teacher.email)).status).toBe(401);
      const on = await api().patch(`/api/v1/users/${t.teacher.id}/status`).set(as(t.adminToken)).send({ isActive: true });
      expect(on.body.data.isActive).toBe(true);
    });
  });
});
