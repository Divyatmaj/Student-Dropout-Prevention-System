/**
 * Demo staff accounts used in mock mode (VITE_USE_MOCKS=true).
 * The Udaan API seed script will create the same accounts.
 *
 * Contract:
 *   POST  /auth/login        body { email, password } → { token, user }
 *   GET   /auth/me                                    → user
 *   GET   /users?search=&role=&status=   (admin, principal) → { users, total }
 *   GET   /users/assignable  (all staff) → { users: [{ id, name, role }] } — active staff only
 *   GET   /users/:id         (admin, principal) → user
 *   POST  /users             (admin) body { name, email, role, password } → user  (409 DUPLICATE_EMAIL)
 *   PATCH /users/:id         (admin) body { name?, email?, role? } → user
 *   PATCH /users/:id/status  (admin) body { isActive } → user
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
    createdAt: '2026-06-01T09:00:00.000Z',
    name: 'Radhika Sharma',
    email: 'admin@udaan.demo',
    role: 'SCHOOL_ADMIN',
    isActive: true,
    schoolId: DEMO_SCHOOL.id,
    schoolName: DEMO_SCHOOL.name,
  },
  {
    id: 'USR-002',
    createdAt: '2026-06-01T09:05:00.000Z',
    name: 'Amit Verma',
    email: 'principal@udaan.demo',
    role: 'PRINCIPAL',
    isActive: true,
    schoolId: DEMO_SCHOOL.id,
    schoolName: DEMO_SCHOOL.name,
  },
  {
    id: 'USR-003',
    createdAt: '2026-06-02T10:00:00.000Z',
    name: 'Neha Gupta',
    email: 'teacher@udaan.demo',
    role: 'TEACHER',
    isActive: true,
    schoolId: DEMO_SCHOOL.id,
    schoolName: DEMO_SCHOOL.name,
  },
  {
    id: 'USR-004',
    createdAt: '2026-06-02T10:05:00.000Z',
    name: 'Sandeep Patil',
    email: 'inactive@udaan.demo',
    role: 'TEACHER',
    isActive: false,
    schoolId: DEMO_SCHOOL.id,
    schoolName: DEMO_SCHOOL.name,
  },
  {
    id: 'USR-005',
    createdAt: '2026-07-15T11:30:00.000Z',
    name: 'Farhan Khan',
    email: 'farhan.khan@udaan.demo',
    role: 'TEACHER',
    isActive: true,
    schoolId: DEMO_SCHOOL.id,
    schoolName: DEMO_SCHOOL.name,
  },
];

/**
 * Mock mode only: passwords for accounts created from the Staff page
 * (seeded accounts use DEMO_PASSWORD). The API stores bcrypt hashes instead.
 */
export const mockPasswords = new Map();
