/**
 * Demo staff accounts used in mock mode (VITE_USE_MOCKS=true).
 * The Udaan API seed script will create the same accounts.
 *
 * Contract:
 *   POST /auth/login  body { email, password } → { token, user }
 *   GET  /auth/me                              → user
 * `user` never includes a password or password hash.
 */

export const DEMO_PASSWORD = 'Udaan@123';

export const DEMO_SCHOOL = {
  id: 'SCH-001',
  name: 'Udaan Demo School',
  code: 'UDN',
};

export const mockUsers = [
  {
    id: 'USR-001',
    name: 'Radhika Sharma',
    email: 'admin@udaan.demo',
    role: 'SCHOOL_ADMIN',
    isActive: true,
    schoolId: DEMO_SCHOOL.id,
    schoolName: DEMO_SCHOOL.name,
  },
  {
    id: 'USR-002',
    name: 'Amit Verma',
    email: 'principal@udaan.demo',
    role: 'PRINCIPAL',
    isActive: true,
    schoolId: DEMO_SCHOOL.id,
    schoolName: DEMO_SCHOOL.name,
  },
  {
    id: 'USR-003',
    name: 'Neha Gupta',
    email: 'teacher@udaan.demo',
    role: 'TEACHER',
    isActive: true,
    schoolId: DEMO_SCHOOL.id,
    schoolName: DEMO_SCHOOL.name,
  },
  {
    id: 'USR-004',
    name: 'Sandeep Patil',
    email: 'inactive@udaan.demo',
    role: 'TEACHER',
    isActive: false,
    schoolId: DEMO_SCHOOL.id,
    schoolName: DEMO_SCHOOL.name,
  },
];
