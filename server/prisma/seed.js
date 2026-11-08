/**
 * Seed the Udaan demo school and its staff accounts.
 *
 *   npm run db:seed                         (from the repo root)
 *
 * Safe to run more than once: existing accounts are updated in place and
 * keep their current password. Set SEED_RESET_PASSWORDS=true to reset every
 * demo account to the demo password.
 *
 * The demo password is public (it is in the README), so never seed a
 * database that holds a real school's data.
 */
import { getPrisma, disconnectPrisma } from '../src/config/prisma.js';
import { env } from '../src/config/env.js';
import { hashPassword } from '../src/utils/passwords.js';

export const DEMO_PASSWORD = 'Udaan@123';

export const DEMO_SCHOOL = { code: 'UDN', name: 'Udaan Demo School', address: 'Pune, Maharashtra' };

export const DEMO_STAFF = [
  { email: 'admin@udaan.demo', name: 'Radhika Sharma', role: 'SCHOOL_ADMIN', isActive: true },
  { email: 'principal@udaan.demo', name: 'Amit Verma', role: 'PRINCIPAL', isActive: true },
  { email: 'teacher@udaan.demo', name: 'Neha Gupta', role: 'TEACHER', isActive: true },
  { email: 'farhan.khan@udaan.demo', name: 'Farhan Khan', role: 'TEACHER', isActive: true },
  { email: 'inactive@udaan.demo', name: 'Sandeep Patil', role: 'TEACHER', isActive: false },
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
  for (const staff of DEMO_STAFF) {
    const existing = await prisma.user.findUnique({ where: { email: staff.email }, select: { id: true } });
    await prisma.user.upsert({
      where: { email: staff.email },
      update: { ...staff, schoolId: school.id, ...(resetPasswords && { passwordHash: demoHash }) },
      create: { ...staff, schoolId: school.id, passwordHash: demoHash },
    });
    results.push(`${existing ? 'updated' : 'created'}  ${staff.email.padEnd(24)} ${staff.role}${staff.isActive ? '' : ' (inactive)'}`);
  }

  console.log(`School: ${school.name} (${school.code})`);
  results.forEach((line) => console.log(`  ${line}`));
  console.log(`Demo password for new accounts: ${DEMO_PASSWORD}${resetPasswords ? ' (all demo passwords reset)' : ''}`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(disconnectPrisma);
