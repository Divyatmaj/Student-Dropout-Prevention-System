/**
 * Staff accounts within the signed-in user's school. Every query is scoped
 * by schoolId, so an id from another school behaves as "not found".
 */
import { getPrisma } from '../config/prisma.js';
import { AppError, notFound, validationError } from '../utils/AppError.js';
import { hashPassword } from '../utils/passwords.js';
import { PUBLIC_USER_SELECT, toPublicUser } from '../utils/users.js';

const OPEN_STATUSES = ['OPEN', 'IN_PROGRESS'];

const LIST_SELECT = {
  ...PUBLIC_USER_SELECT,
  _count: {
    select: {
      assignedStudents: { where: { status: 'ACTIVE' } },
      interventionsAssigned: { where: { status: { in: OPEN_STATUSES } } },
    },
  },
};

function withCounts(user) {
  const { _count, ...rest } = user;
  return {
    ...toPublicUser(rest),
    assignedStudents: _count?.assignedStudents ?? 0,
    openInterventions: _count?.interventionsAssigned ?? 0,
  };
}

const duplicateEmail = () =>
  new AppError({
    status: 409,
    code: 'DUPLICATE_EMAIL',
    message: 'Another account already uses this email.',
    details: [{ field: 'email', message: 'Another account already uses this email.' }],
  });

async function findInSchool(schoolId, id, select = LIST_SELECT) {
  const user = await getPrisma().user.findFirst({ where: { id, schoolId }, select });
  if (!user) throw notFound('Staff member not found.', 'USER_NOT_FOUND');
  return user;
}

async function assertEmailFree(email, exceptId) {
  const clash = await getPrisma().user.findUnique({ where: { email }, select: { id: true } });
  if (clash && clash.id !== exceptId) throw duplicateEmail();
}

/** GET /users */
export async function listUsers(actor, { search, role, status }) {
  const where = {
    schoolId: actor.schoolId,
    ...(role && { role }),
    ...(status && { isActive: status === 'active' }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };
  const users = await getPrisma().user.findMany({
    where,
    select: LIST_SELECT,
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
  });
  return { users: users.map(withCounts), total: users.length };
}

/** GET /users/assignable — active staff who can own an intervention. */
export async function listAssignable(actor) {
  const users = await getPrisma().user.findMany({
    where: { schoolId: actor.schoolId, isActive: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: 'asc' },
  });
  return { users };
}

/** GET /users/:id */
export async function getUser(actor, id) {
  return withCounts(await findInSchool(actor.schoolId, id));
}

/** POST /users — new staff account in the admin's school, with a temporary password. */
export async function createUser(actor, { name, email, role, password }) {
  await assertEmailFree(email);
  const user = await getPrisma().user.create({
    data: { name, email, role, passwordHash: await hashPassword(password), schoolId: actor.schoolId },
    select: LIST_SELECT,
  });
  return withCounts(user);
}

/** PATCH /users/:id — name, email, role. Admins cannot change their own role. */
export async function updateUser(actor, id, changes) {
  const existing = await findInSchool(actor.schoolId, id);
  if (changes.role && changes.role !== existing.role) {
    if (id === actor.id) throw validationError([{ field: 'role', message: 'You cannot change your own role.' }]);
    if (existing.role === 'SCHOOL_ADMIN' && existing.isActive) await assertAnotherActiveAdmin(actor.schoolId, id);
  }
  if (changes.email && changes.email !== existing.email) await assertEmailFree(changes.email, id);

  const user = await getPrisma().user.update({ where: { id }, data: changes, select: LIST_SELECT });
  return withCounts(user);
}

/** PATCH /users/:id/status — activate or deactivate. Records and history are kept. */
export async function setUserStatus(actor, id, isActive) {
  const existing = await findInSchool(actor.schoolId, id);
  if (!isActive && id === actor.id) {
    throw new AppError({ status: 409, code: 'CANNOT_DEACTIVATE_SELF', message: 'You cannot deactivate your own account.' });
  }
  if (!isActive && existing.role === 'SCHOOL_ADMIN' && existing.isActive) {
    await assertAnotherActiveAdmin(actor.schoolId, id);
  }
  const user = await getPrisma().user.update({ where: { id }, data: { isActive }, select: LIST_SELECT });
  return withCounts(user);
}

// Safety net: with the current permissions the acting admin always remains,
// but this keeps a school from ever being left without an active admin.
async function assertAnotherActiveAdmin(schoolId, exceptId) {
  const others = await getPrisma().user.count({
    where: { schoolId, role: 'SCHOOL_ADMIN', isActive: true, id: { not: exceptId } },
  });
  if (others === 0) {
    throw new AppError({ status: 409, code: 'LAST_ADMIN', message: 'The school needs at least one active school administrator.' });
  }
}
