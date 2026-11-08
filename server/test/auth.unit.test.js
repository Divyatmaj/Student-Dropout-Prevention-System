import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { PERMISSIONS } from '@udaan/shared';

import app from '../src/app.js';
import { signToken, verifyToken } from '../src/utils/tokens.js';
import { authorize } from '../src/middleware/authorize.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { createLoginLimiter } from '../src/routes/auth.routes.js';

const user = { id: '3f2b0d8e-8a43-4c35-9a3b-4a2f3c1d2e10', role: 'TEACHER', schoolId: 'b2c1d0e8-8a43-4c35-9a3b-4a2f3c1d2e11', isActive: true };

describe('tokens', () => {
  it('round-trips the user id, role and school', () => {
    const claims = verifyToken(signToken(user));
    expect(claims).toMatchObject({ sub: user.id, role: 'TEACHER', schoolId: user.schoolId, iss: 'udaan-api' });
  });

  it('rejects a token signed with another secret', () => {
    const forged = jwt.sign({ role: 'SCHOOL_ADMIN' }, 'some-other-secret-that-is-also-long-enough', { subject: user.id, issuer: 'udaan-api' });
    expect(() => verifyToken(forged)).toThrow(expect.objectContaining({ status: 401, code: 'UNAUTHORIZED' }));
  });

  it('rejects an unsigned (alg: none) token', () => {
    const unsigned = jwt.sign({ role: 'SCHOOL_ADMIN' }, null, { algorithm: 'none', subject: user.id, issuer: 'udaan-api' });
    expect(() => verifyToken(unsigned)).toThrow(expect.objectContaining({ status: 401 }));
  });

  it('reports an expired token as TOKEN_EXPIRED', () => {
    const expired = jwt.sign({}, process.env.JWT_SECRET, { subject: user.id, issuer: 'udaan-api', expiresIn: -10 });
    expect(() => verifyToken(expired)).toThrow(expect.objectContaining({ status: 401, code: 'TOKEN_EXPIRED' }));
  });
});

describe('authorize()', () => {
  const makeApp = (role) => {
    const a = express();
    a.get('/x', (req, res, next) => {
      req.user = { ...user, role };
      next();
    }, authorize(PERMISSIONS.STAFF_MANAGE), (req, res) => res.json({ ok: true }));
    a.use(errorHandler);
    return a;
  };

  it('allows a role that has the permission', async () => {
    expect((await request(makeApp('SCHOOL_ADMIN')).get('/x')).status).toBe(200);
  });

  it('returns 403 FORBIDDEN otherwise', async () => {
    const res = await request(makeApp('PRINCIPAL')).get('/x');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

describe('protected routes without a valid token', () => {
  it.each(['/api/v1/auth/me', '/api/v1/users', '/api/v1/users/assignable'])('%s → 401', async (path) => {
    const res = await request(app).get(path);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects a malformed Authorization header', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Authorization', 'Token abc');
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/login validation', () => {
  it('returns 422 with field details before touching the database', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: '', password: '' });
    expect(res.status).toBe(422);
    expect(res.body.error.details.map((d) => d.field).sort()).toEqual(['email', 'password']);
  });
});

describe('login rate limit', () => {
  const limited = express();
  limited.use(express.json());
  limited.post('/login', createLoginLimiter(2), (req, res) => res.status(401).json({ success: false }));

  it('returns 429 TOO_MANY_ATTEMPTS after the limit of failed attempts for one email', async () => {
    const attempt = (email) => request(limited).post('/login').send({ email, password: 'x' });
    expect((await attempt('a@x.org')).status).toBe(401);
    expect((await attempt('A@x.org ')).status).toBe(401);
    const blocked = await attempt('a@x.org');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_ATTEMPTS');
    // A different email from the same IP is counted separately.
    expect((await attempt('b@x.org')).status).toBe(401);
  });
});
