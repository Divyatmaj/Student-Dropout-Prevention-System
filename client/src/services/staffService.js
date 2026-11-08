import { apiClient, ApiError, USE_MOCKS, mockDelay, buildQuery } from './api.js';
import { getMockSessionUser } from './authService.js';
import { mockUsers, mockPasswords, DEMO_SCHOOL } from '../data/mockUsersData.js';
import { mockStudentsList } from '../data/mockStudentsData.js';
import { mockInterventionsList } from '../data/mockInterventionsData.js';
import { STAFF_ROLES, MIN_PASSWORD_LENGTH } from '../constants/staff.js';
import { ROLE_LABELS, PERMISSIONS, can } from '../utils/permissions.js';

/*
 * Staff accounts (contract in data/mockUsersData.js). A user object never
 * includes a password or hash. List rows also carry `assignedStudents` and
 * `openInterventions` counts.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validationError(details) {
  return new ApiError({ status: 422, code: 'VALIDATION_ERROR', message: 'Please fix the highlighted fields.', details });
}

function requirePermission(permission) {
  if (!can(getMockSessionUser(), permission)) {
    throw new ApiError({ status: 403, code: 'FORBIDDEN', message: 'You do not have permission to manage staff accounts.' });
  }
}

function findUser(id) {
  const user = mockUsers.find((u) => u.id === id);
  if (!user) throw new ApiError({ status: 404, code: 'USER_NOT_FOUND', message: 'Staff member not found.' });
  return user;
}

function withCounts(user) {
  return {
    ...user,
    assignedStudents: mockStudentsList.filter((s) => s.assignedTeacherId === user.id && s.status === 'ACTIVE').length,
    openInterventions: mockInterventionsList.filter(
      (i) => i.assignedToId === user.id && (i.status === 'OPEN' || i.status === 'IN_PROGRESS')
    ).length,
  };
}

function validateFields(values, { partial = false } = {}) {
  const details = [];
  const has = (k) => !partial || values[k] !== undefined;
  if (has('name') && (values.name || '').trim().length < 2) details.push({ field: 'name', message: 'Enter the full name.' });
  if (has('email')) {
    const email = (values.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) details.push({ field: 'email', message: 'Enter a valid email address.' });
  }
  if (has('role') && !STAFF_ROLES.includes(values.role)) details.push({ field: 'role', message: 'Choose a role.' });
  return details;
}

function duplicateEmail(email, exceptId) {
  return mockUsers.some((u) => u.email.toLowerCase() === email && u.id !== exceptId);
}

/**
 * Staff in the signed-in user's school.
 * GET /users?search=&role=&status=active|inactive  (admin, principal)
 */
export async function getStaff(filters = {}) {
  const { search = '', role = '', status = '' } = filters;
  if (!USE_MOCKS) return apiClient(`/users${buildQuery({ search, role, status })}`);

  await mockDelay(300);
  requirePermission(PERMISSIONS.STAFF_VIEW);
  const q = search.trim().toLowerCase();
  const users = mockUsers
    .filter(
      (u) =>
        (!role || u.role === role) &&
        (!status || (status === 'active' ? u.isActive : !u.isActive)) &&
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    )
    .map(withCounts)
    .sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name));
  return { users, total: users.length };
}

/**
 * Active staff that an intervention can be assigned to (all staff roles).
 * GET /users/assignable → { users: [{ id, name, role }] }
 */
export async function getAssignableStaff() {
  if (!USE_MOCKS) return apiClient('/users/assignable');

  await mockDelay(150);
  return {
    users: mockUsers
      .filter((u) => u.isActive)
      .map((u) => ({ id: u.id, name: u.name, role: u.role }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/**
 * Create a staff account with a temporary password (school admin).
 * POST /users body { name, email, role, password }
 */
export async function createStaff(payload) {
  if (!USE_MOCKS) return apiClient('/users', { method: 'POST', body: JSON.stringify(payload) });

  await mockDelay(400);
  requirePermission(PERMISSIONS.STAFF_MANAGE);
  const details = validateFields(payload);
  if ((payload.password || '').length < MIN_PASSWORD_LENGTH) {
    details.push({ field: 'password', message: `Use at least ${MIN_PASSWORD_LENGTH} characters.` });
  }
  if (details.length) throw validationError(details);

  const email = payload.email.trim().toLowerCase();
  if (duplicateEmail(email)) {
    throw new ApiError({
      status: 409,
      code: 'DUPLICATE_EMAIL',
      message: 'Another account already uses this email.',
      details: [{ field: 'email', message: 'Another account already uses this email.' }],
    });
  }

  const max = mockUsers.reduce((acc, u) => Math.max(acc, Number(u.id.replace(/\D/g, '')) || 0), 0);
  const user = {
    id: `USR-${String(max + 1).padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
    name: payload.name.trim(),
    email,
    role: payload.role,
    isActive: true,
    schoolId: DEMO_SCHOOL.id,
    schoolName: DEMO_SCHOOL.name,
  };
  mockUsers.push(user);
  mockPasswords.set(user.id, payload.password);
  return withCounts(user);
}

/**
 * Update name, email or role (school admin). Admins cannot change their own role.
 * PATCH /users/:id body { name?, email?, role? }
 */
export async function updateStaff(id, changes) {
  if (!USE_MOCKS) return apiClient(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(changes) });

  await mockDelay(350);
  requirePermission(PERMISSIONS.STAFF_MANAGE);
  const user = findUser(id);
  const details = validateFields(changes, { partial: true });
  const me = getMockSessionUser();
  if (changes.role && changes.role !== user.role && me?.id === id) {
    details.push({ field: 'role', message: 'You cannot change your own role.' });
  }
  if (details.length) throw validationError(details);

  if (changes.email !== undefined) {
    const email = changes.email.trim().toLowerCase();
    if (duplicateEmail(email, id)) {
      throw new ApiError({
        status: 409,
        code: 'DUPLICATE_EMAIL',
        message: 'Another account already uses this email.',
        details: [{ field: 'email', message: 'Another account already uses this email.' }],
      });
    }
    user.email = email;
  }
  if (changes.name !== undefined) user.name = changes.name.trim();
  if (changes.role !== undefined) user.role = changes.role;
  return withCounts(user);
}

/**
 * Activate or deactivate an account (school admin). Deactivated staff cannot
 * sign in or be assigned new work; their records and history are kept.
 * PATCH /users/:id/status body { isActive }
 */
export async function setStaffStatus(id, isActive) {
  if (!USE_MOCKS) return apiClient(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) });

  await mockDelay(350);
  requirePermission(PERMISSIONS.STAFF_MANAGE);
  const user = findUser(id);
  if (!isActive && getMockSessionUser()?.id === id) {
    throw new ApiError({ status: 409, code: 'CANNOT_DEACTIVATE_SELF', message: 'You cannot deactivate your own account.' });
  }
  if (!isActive && user.role === 'SCHOOL_ADMIN' && mockUsers.filter((u) => u.isActive && u.role === 'SCHOOL_ADMIN').length === 1) {
    throw new ApiError({
      status: 409,
      code: 'LAST_ADMIN',
      message: `The school needs at least one active ${ROLE_LABELS.SCHOOL_ADMIN.toLowerCase()}.`,
    });
  }
  user.isActive = Boolean(isActive);
  return withCounts(user);
}
