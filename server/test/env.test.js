import { describe, it, expect } from 'vitest';

import { cleanSecretValue, describeStart } from '../src/config/env.js';

describe('environment value clean-up', () => {
  const url = 'postgresql://user:pass@ep-x-pooler.aws.neon.tech/neondb?sslmode=require';

  it('removes surrounding quotes and a pasted NAME= prefix', () => {
    expect(cleanSecretValue('DATABASE_URL', `"${url}"`)).toBe(url);
    expect(cleanSecretValue('DATABASE_URL', `'${url}'`)).toBe(url);
    expect(cleanSecretValue('DATABASE_URL', `DATABASE_URL="${url}"`)).toBe(url);
    expect(cleanSecretValue('DATABASE_URL', `  ${url}  `)).toBe(url);
    expect(cleanSecretValue('DATABASE_URL', undefined)).toBeUndefined();
  });

  it('leaves values it does not understand for validation to reject', () => {
    expect(cleanSecretValue('DATABASE_URL', `psql '${url}'`)).toBe(`psql '${url}'`);
  });

  it('describes a bad value without revealing anything after the first colon', () => {
    expect(describeStart(`psql '${url}'`)).toBe('starts with "psql \'postgresq…"');
    expect(describeStart('https://user:secret@host')).toBe('starts with "https…"');
    expect(describeStart('')).toBe('empty');
  });
});
