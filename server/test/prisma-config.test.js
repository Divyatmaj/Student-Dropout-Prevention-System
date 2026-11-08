import { describe, it, expect } from 'vitest';

import { withVerifiedSsl } from '../src/config/prisma.js';

describe('withVerifiedSsl', () => {
  it('upgrades sslmode=require to verify-full and keeps other params', () => {
    const out = new URL(withVerifiedSsl('postgresql://u:p@ep-x-pooler.aws.neon.tech/db?channel_binding=require&sslmode=require'));
    expect(out.searchParams.get('sslmode')).toBe('verify-full');
    expect(out.searchParams.get('channel_binding')).toBe('require');
    expect(out.hostname).toBe('ep-x-pooler.aws.neon.tech');
  });

  it('leaves local URLs, verify-full and libpq-compat strings unchanged', () => {
    expect(withVerifiedSsl('postgresql://u@localhost:5432/db')).toBe('postgresql://u@localhost:5432/db');
    expect(new URL(withVerifiedSsl('postgresql://h/db?sslmode=verify-full')).searchParams.get('sslmode')).toBe('verify-full');
    expect(new URL(withVerifiedSsl('postgresql://h/db?uselibpqcompat=true&sslmode=require')).searchParams.get('sslmode')).toBe('require');
  });
});
