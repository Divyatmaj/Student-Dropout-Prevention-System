import { describe, it, expect } from 'vitest';
import request from 'supertest';

import app from '../src/app.js';

const hasDatabase = Boolean(process.env.TEST_DATABASE_URL);

describe('GET /api/v1/health', () => {
  it('returns the success envelope', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ status: 'ok', service: 'udaan-api', environment: 'test' });
  });

  it('sets security and no-cache headers and hides Express', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('sends no CORS headers when no origins are configured', async () => {
    const res = await request(app).get('/api/v1/health').set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('errors use the standard envelope', () => {
  it('404 for an unknown route', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'ROUTE_NOT_FOUND', message: 'No API route for GET /api/v1/nope.', details: [] },
    });
  });

  it('400 for malformed JSON', async () => {
    const res = await request(app).post('/api/v1/health').set('Content-Type', 'application/json').send('{"bad": ');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MALFORMED_JSON');
  });

  it('413 for a body over the size limit', async () => {
    const res = await request(app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ text: 'x'.repeat(150 * 1024) }));
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});

describe.skipIf(hasDatabase)('GET /api/v1/health/db without a database', () => {
  it('returns 503 DATABASE_NOT_CONFIGURED', async () => {
    const res = await request(app).get('/api/v1/health/db');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('DATABASE_NOT_CONFIGURED');
  });
});

describe.skipIf(!hasDatabase)('GET /api/v1/health/db with TEST_DATABASE_URL', () => {
  it('reaches the database', async () => {
    const res = await request(app).get('/api/v1/health/db');
    expect(res.status).toBe(200);
    expect(res.body.data.database).toBe('ok');
  });
});
