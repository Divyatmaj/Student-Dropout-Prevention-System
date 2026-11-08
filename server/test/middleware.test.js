import { describe, it, expect, vi, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { validate } from '../src/middleware/validate.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { conflict } from '../src/utils/AppError.js';

function makeApp(register) {
  const app = express();
  app.use(express.json());
  register(app);
  app.use(errorHandler);
  return app;
}

afterEach(() => vi.restoreAllMocks());

describe('validate()', () => {
  const app = makeApp((a) =>
    a.post(
      '/items/:id',
      validate({
        params: z.object({ id: z.uuid() }),
        query: z.object({ limit: z.coerce.number().int().max(50).default(20) }),
        body: z.object({ name: z.string().trim().min(2, 'Enter a name.'), grade: z.enum(['1', '2']) }),
      }),
      (req, res) => res.json(req.validated)
    )
  );
  const id = '3f2b0d8e-8a43-4c35-9a3b-4a2f3c1d2e10';

  it('passes parsed values on req.validated', async () => {
    const res = await request(app).post(`/items/${id}?limit=5`).send({ name: '  Asha ', grade: '1' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ params: { id }, query: { limit: 5 }, body: { name: 'Asha', grade: '1' } });
  });

  it('returns 422 with a detail per invalid field', async () => {
    const res = await request(app).post('/items/not-a-uuid?limit=500').send({ name: 'A', grade: '9' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d) => d.field).sort()).toEqual(['grade', 'id', 'limit', 'name']);
    expect(res.body.error.details.find((d) => d.field === 'name').message).toBe('Enter a name.');
  });
});

describe('errorHandler', () => {
  it('passes AppError status, code and details through', async () => {
    const app = makeApp((a) =>
      a.get('/x', () => {
        throw conflict('Code taken.', 'DUPLICATE_STUDENT_CODE', [{ field: 'studentCode', message: 'In use.' }]);
      })
    );
    const res = await request(app).get('/x');
    expect(res.status).toBe(409);
    expect(res.body.error).toEqual({
      code: 'DUPLICATE_STUDENT_CODE',
      message: 'Code taken.',
      details: [{ field: 'studentCode', message: 'In use.' }],
    });
  });

  it('maps a Prisma unique violation to 409 DUPLICATE', async () => {
    const app = makeApp((a) =>
      a.get('/x', async () => {
        throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: Prisma.prismaVersion.client,
          meta: { target: ['email'] },
        });
      })
    );
    const res = await request(app).get('/x');
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE');
    expect(res.body.error.details).toEqual([{ field: 'email', message: 'Already in use.' }]);
  });

  it('maps a missing Prisma record to 404', async () => {
    const app = makeApp((a) =>
      a.get('/x', async () => {
        throw new Prisma.PrismaClientKnownRequestError('Not found', { code: 'P2025', clientVersion: Prisma.prismaVersion.client });
      })
    );
    expect((await request(app).get('/x')).status).toBe(404);
  });

  it('hides unexpected errors behind a generic 500', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = makeApp((a) =>
      a.get('/x', async () => {
        throw new Error('secret connection string leaked');
      })
    );
    const res = await request(app).get('/x');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });
});
