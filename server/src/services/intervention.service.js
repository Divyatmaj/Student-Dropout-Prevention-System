/**
 * Interventions: owned, time-bound support actions with an append-only history.
 *
 * - Anyone may create one for a student in their scope; it must have an
 *   active owner from the same school and a due date.
 * - Only the creator, the owner, a principal or a school admin may change it
 *   (shared canManageIntervention).
 * - Completing needs an outcome; cancelling and reopening need a reason
 *   (shared validateStatusChange). Nothing is ever deleted.
 * - The student's risk reasons are copied into riskSnapshot at creation and
 *   never changed.
 * - Teachers see interventions for their assigned students, plus any they
 *   created or own.
 */
import {
  isInterventionOpen,
  isInterventionOverdue,
  daysOverdue,
  validateStatusChange,
  validateInterventionFields,
  canManageIntervention,
  OPEN_INTERVENTION_STATUSES,
} from '@udaan/shared';

import { getPrisma } from '../config/prisma.js';
import { AppError, forbidden, notFound, validationError } from '../utils/AppError.js';
import { fromDbDate, toDbDate, schoolToday, addDays } from '../utils/dates.js';
import { studentScope, findStudentInScope, isTeacher } from './scope.js';
import { recalculateStudentRisk } from './risk.service.js';

const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const STATUS_ORDER = { OPEN: 0, IN_PROGRESS: 0, COMPLETED: 1, CANCELLED: 2 };
const EDITABLE = ['category', 'priority', 'description', 'actionPlan', 'assignedToId', 'dueDate', 'followUpDate'];

const INCLUDE = {
  student: { select: { id: true, fullName: true, studentCode: true, grade: true, section: true, status: true } },
  assignedTo: { select: { name: true } },
  createdBy: { select: { name: true } },
  history: { include: { actor: { select: { name: true } } }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
};

/** Interventions this user may see. */
function visibleWhere(user, extra = {}) {
  return {
    schoolId: user.schoolId,
    ...(isTeacher(user) && {
      OR: [{ student: studentScope(user) }, { assignedToId: user.id }, { createdById: user.id }],
    }),
    ...extra,
  };
}

/** Row → API shape (dates as YYYY-MM-DD, computed overdue fields, history). */
export function toIntervention(i, today = schoolToday()) {
  const plain = {
    id: i.id,
    studentId: i.studentId,
    category: i.category,
    priority: i.priority,
    status: i.status,
    description: i.description,
    actionPlan: i.actionPlan,
    outcome: i.outcome,
    dueDate: fromDbDate(i.dueDate),
    followUpDate: fromDbDate(i.followUpDate),
    assignedToId: i.assignedToId,
    assignedToName: i.assignedTo?.name ?? null,
    createdById: i.createdById,
    createdByName: i.createdBy?.name ?? null,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
    riskSnapshot: i.riskSnapshot ?? null,
  };
  return {
    ...plain,
    isOpen: isInterventionOpen(plain),
    isOverdue: isInterventionOverdue(plain, today),
    daysOverdue: daysOverdue(plain, today),
    student: i.student ?? null,
    history: (i.history ?? []).map((e) => ({
      id: e.id,
      at: e.createdAt,
      byId: e.actorId,
      byName: e.actor?.name ?? null,
      type: e.type,
      ...(e.fromStatus && { fromStatus: e.fromStatus }),
      ...(e.toStatus && { toStatus: e.toStatus }),
      ...(e.fields && { fields: e.fields }),
      ...(e.note && { note: e.note }),
    })),
  };
}

async function findVisible(user, id) {
  const row = await getPrisma().intervention.findFirst({ where: visibleWhere(user, { id }), include: INCLUDE });
  if (!row) throw notFound('Intervention not found.', 'INTERVENTION_NOT_FOUND');
  return row;
}

function requireManage(user, intervention) {
  if (!canManageIntervention(user, intervention)) {
    throw forbidden('Only the creator, the owner, a principal or a school admin can change this intervention.');
  }
}

async function activeOwner(schoolId, id) {
  return getPrisma().user.findFirst({ where: { id, schoolId, isActive: true }, select: { id: true, name: true } });
}

/** GET /interventions/overview → { counts, open, overdue, dueThisWeek, mine } */
export async function getOverview(user) {
  const today = schoolToday();
  const weekEnd = addDays(today, 7);
  const rows = await getPrisma().intervention.findMany({
    where: visibleWhere(user),
    select: { status: true, dueDate: true, assignedToId: true },
  });
  const counts = { OPEN: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 };
  rows.forEach((r) => {
    counts[r.status] += 1;
  });
  const open = rows.filter((r) => OPEN_INTERVENTION_STATUSES.includes(r.status)).map((r) => ({ ...r, dueDate: fromDbDate(r.dueDate) }));
  return {
    counts,
    open: open.length,
    overdue: open.filter((r) => isInterventionOverdue(r, today)).length,
    dueThisWeek: open.filter((r) => r.dueDate && r.dueDate >= today && r.dueDate <= weekEnd).length,
    mine: open.filter((r) => r.assignedToId === user.id).length,
  };
}

/**
 * GET /interventions?status=&priority=&category=&assignedTo=me|<id>&due=overdue|week&studentId=&search=
 * Open first (overdue, then soonest due), then closed, newest first.
 */
export async function listInterventions(user, { status, priority, category, assignedTo, due, studentId, search }) {
  const today = schoolToday();
  const where = visibleWhere(user, {
    ...(status === 'active' ? { status: { in: OPEN_INTERVENTION_STATUSES } } : status ? { status } : {}),
    ...(priority && { priority }),
    ...(category && { category }),
    ...(assignedTo && { assignedToId: assignedTo === 'me' ? user.id : assignedTo }),
    ...(studentId && { studentId }),
    ...(due === 'overdue' && { status: { in: OPEN_INTERVENTION_STATUSES }, dueDate: { lt: toDbDate(today) } }),
    ...(due === 'week' && { status: { in: OPEN_INTERVENTION_STATUSES }, dueDate: { gte: toDbDate(today), lte: toDbDate(addDays(today, 7)) } }),
    ...(search && {
      AND: [
        {
          OR: [
            { student: { fullName: { contains: search, mode: 'insensitive' } } },
            { student: { studentCode: { contains: search, mode: 'insensitive' } } },
            { assignedTo: { name: { contains: search, mode: 'insensitive' } } },
          ],
        },
      ],
    }),
  });
  const rows = await getPrisma().intervention.findMany({ where, include: INCLUDE });
  const interventions = rows
    .map((r) => toIntervention(r, today))
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        (a.isOpen
          ? Number(b.isOverdue) - Number(a.isOverdue) ||
            (a.dueDate || '9999').localeCompare(b.dueDate || '9999') ||
            PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
          : new Date(b.updatedAt) - new Date(a.updatedAt))
    );
  return { interventions, total: interventions.length };
}

/** GET /interventions/:id */
export async function getIntervention(user, id) {
  return toIntervention(await findVisible(user, id));
}

/** POST /interventions */
export async function createIntervention(user, values) {
  const details = validateInterventionFields(values);
  if (details.length) throw validationError(details);

  const student = await findStudentInScope(user, values.studentId, {
    select: { id: true, status: true, riskAssessment: { select: { score: true, category: true, reasons: true } } },
  });
  if (student.status !== 'ACTIVE') {
    throw validationError([{ field: 'studentId', message: 'Interventions can only be created for active students.' }]);
  }
  const owner = await activeOwner(user.schoolId, values.assignedToId);
  if (!owner) throw validationError([{ field: 'assignedToId', message: 'Choose an active staff member.' }]);

  const risk = student.riskAssessment;
  const created = await getPrisma().intervention.create({
    data: {
      schoolId: user.schoolId,
      studentId: student.id,
      createdById: user.id,
      assignedToId: owner.id,
      category: values.category,
      priority: values.priority ?? 'MEDIUM',
      status: 'OPEN',
      description: values.description,
      actionPlan: values.actionPlan || null,
      dueDate: toDbDate(values.dueDate),
      followUpDate: toDbDate(values.followUpDate),
      riskSnapshot: risk ? { score: risk.score, category: risk.category, reasons: risk.reasons } : undefined,
      history: { create: { actorId: user.id, type: 'CREATED' } },
    },
    include: INCLUDE,
  });
  await recalculateStudentRisk(student.id);
  return toIntervention(created);
}

/**
 * PATCH /interventions/:id — plan, owner, priority, dates, with an optional
 * note. Sending only `note` adds a progress note.
 */
export async function updateIntervention(user, id, changes) {
  const current = await findVisible(user, id);
  requireManage(user, current);

  const { note, ...fields } = changes;
  if (!isInterventionOpen(current) && Object.keys(fields).length) {
    throw new AppError({ status: 409, code: 'INTERVENTION_CLOSED', message: 'Reopen this intervention before changing its plan.' });
  }

  const merged = {
    dueDate: 'dueDate' in fields ? fields.dueDate : fromDbDate(current.dueDate),
    followUpDate: 'followUpDate' in fields ? fields.followUpDate : fromDbDate(current.followUpDate),
  };
  const toValidate = { ...fields, ...(('dueDate' in fields || 'followUpDate' in fields) && merged) };
  const details = validateInterventionFields(toValidate, { partial: true });
  const noteText = (note || '').trim();
  if (note !== undefined && Object.keys(fields).length === 0 && noteText.length < 3) {
    details.push({ field: 'note', message: 'Write a note first.' });
  }

  let owner = null;
  if (fields.assignedToId && fields.assignedToId !== current.assignedToId) {
    owner = await activeOwner(user.schoolId, fields.assignedToId);
    if (!owner) details.push({ field: 'assignedToId', message: 'Choose an active staff member.' });
  }
  if (details.length) throw validationError(details);

  const currentPlain = { ...current, dueDate: fromDbDate(current.dueDate), followUpDate: fromDbDate(current.followUpDate) };
  const changed = ['description', 'actionPlan', 'priority', 'category', 'dueDate', 'followUpDate'].filter(
    (k) => k in fields && (fields[k] || null) !== (currentPlain[k] || null)
  );

  const data = {};
  changed.forEach((k) => {
    data[k] = k === 'dueDate' || k === 'followUpDate' ? toDbDate(fields[k]) : fields[k] || null;
  });
  if (owner) data.assignedToId = owner.id;

  const events = [];
  if (owner) events.push({ actorId: user.id, type: 'REASSIGNED', note: `Owner changed from ${current.assignedTo?.name ?? 'nobody'} to ${owner.name}.` });
  if (changed.length) events.push({ actorId: user.id, type: 'UPDATED', fields: changed, ...(noteText && { note: noteText }) });
  else if (noteText) events.push({ actorId: user.id, type: 'NOTE', note: noteText });

  if (events.length === 0) return toIntervention(current);
  // Events from one request share a timestamp; space them by 1 ms so the history keeps their order.
  const start = Date.now();
  events.forEach((e, i) => {
    e.createdAt = new Date(start + i);
  });

  const updated = await getPrisma().intervention.update({
    where: { id },
    data: { ...data, updatedAt: new Date(), history: { create: events } },
    include: INCLUDE,
  });
  if (changed.includes('dueDate')) await recalculateStudentRisk(current.studentId);
  return toIntervention(updated);
}

/** PATCH /interventions/:id/status { status, outcome?, note? } */
export async function changeStatus(user, id, { status, outcome, note }) {
  const current = await findVisible(user, id);
  requireManage(user, current);
  const details = validateStatusChange(current.status, { status, outcome, note });
  if (details.length) throw validationError(details);

  const noteText = (note || '').trim();
  const updated = await getPrisma().intervention.update({
    where: { id },
    data: {
      status,
      ...(status === 'COMPLETED' && { outcome: outcome.trim() }),
      history: {
        create: { actorId: user.id, type: 'STATUS_CHANGED', fromStatus: current.status, toStatus: status, ...(noteText && { note: noteText }) },
      },
    },
    include: INCLUDE,
  });
  await recalculateStudentRisk(current.studentId);
  return toIntervention(updated);
}
