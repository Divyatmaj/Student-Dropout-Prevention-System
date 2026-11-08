/**
 * Helpers for tests that need a real database (TEST_DATABASE_URL).
 * resetDatabase() deletes every row, so it refuses to run unless the
 * database name contains "test".
 */
import { getPrisma } from '../../src/config/prisma.js';
import { hashPassword } from '../../src/utils/passwords.js';

export const hasTestDatabase = Boolean(process.env.TEST_DATABASE_URL);
export const TEST_PASSWORD = 'Test@12345';

export async function resetDatabase() {
  const dbName = new URL(process.env.TEST_DATABASE_URL).pathname.slice(1);
  if (!/test/i.test(dbName)) {
    throw new Error(`Refusing to wipe database "${dbName}": TEST_DATABASE_URL must point at a database whose name contains "test".`);
  }
  await getPrisma().$executeRawUnsafe(`
    TRUNCATE audit_logs, intervention_events, interventions, risk_assessments, student_marks,
             assessments, attendance, students, users, schools RESTART IDENTITY CASCADE`);
}

export async function createSchool(code, name = `School ${code}`) {
  return getPrisma().school.create({ data: { code, name } });
}

export async function createUser(school, { email, name = email.split('@')[0], role = 'TEACHER', isActive = true } = {}) {
  return getPrisma().user.create({
    data: { email, name, role, isActive, schoolId: school.id, passwordHash: await hashPassword(TEST_PASSWORD) },
  });
}
