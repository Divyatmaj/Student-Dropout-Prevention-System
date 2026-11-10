import {
  isInterventionOpen,
  isInterventionOverdue,
  daysOverdue,
  validateStatusChange,
  validateInterventionFields,
} from '@udaan/shared';

import { apiClient, ApiError, USE_MOCKS, mockDelay, buildQuery } from './api.js';
import { getMockSessionUser } from './authService.js';
import { mockInterventionsList } from '../data/mockInterventionsData.js';
import { mockStudentsList } from '../data/mockStudentsData.js';
import { mockUsers } from '../data/mockUsersData.js';
import { mockRiskAssessments, recalculateMockRisk } from '../data/mockRiskStore.js';
import { canManageIntervention } from '../utils/permissions.js';
import { STUDENT_STATUS } from '../constants/students.js';
import { todayISO, addDaysISO } from '../utils/formatters.js';

/*
 * The mock functions below follow the API contract documented in
 * data/mockInterventionsData.js, including the same validation and
 * permission errors (403 for anyone other than the creator, owner,
 * school admin or principal).
 */

/* -------------------------------------------------------------------------- */
/* Mock helpers                                                               */
/* -------------------------------------------------------------------------- */

const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const STATUS_ORDER = { OPEN: 0, IN_PROGRESS: 0, COMPLETED: 1, CANCELLED: 2 };

function validationError(details) {
  return new ApiError({ status: 422, code: 'VALIDATION_ERROR', message: 'Please fix the highlighted fields.', details });
}

function findIntervention(id) {
  const intervention = mockInterventionsList.find((i) => i.id === id);
  if (!intervention) {
    throw new ApiError({ status: 404, code: 'INTERVENTION_NOT_FOUND', message: 'Intervention not found.' });
  }
  return intervention;
}

function requireManage(intervention) {
  const user = getMockSessionUser();
  if (!canManageIntervention(user, intervention)) {
    throw new ApiError({
      status: 403,
      code: 'FORBIDDEN',
      message: 'Only the creator, the owner, a principal or a school admin can change this intervention.',
    });
  }
  return user;
}

function activeStaff(id) {
  return mockUsers.find((u) => u.id === id && u.isActive) || null;
}

function nextId(list, prefix) {
  const max = list.reduce((acc, item) => Math.max(acc, Number(String(item.id).replace(/\D/g, '')) || 0), 0);
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

let eventCounter = 1000;
function addEvent(intervention, user, type, extra = {}) {
  eventCounter += 1;
  intervention.history.push({
    id: `EVT-${eventCounter}`,
    at: new Date().toISOString(),
    byId: user?.id ?? null,
    byName: user?.name ?? 'Staff',
    type,
    ...extra,
  });
  intervention.updatedAt = new Date().toISOString();
}

/** Add computed fields and the student summary, as the API does. */
function present(intervention, today = todayISO()) {
  const s = mockStudentsList.find((st) => st.id === intervention.studentId);
  return {
    ...intervention,
    history: [...intervention.history],
    isOpen: isInterventionOpen(intervention),
    isOverdue: isInterventionOverdue(intervention, today),
    daysOverdue: daysOverdue(intervention, today),
    student: s
      ? { id: s.id, fullName: s.fullName, studentCode: s.studentCode, grade: s.grade, section: s.section, status: s.status }
      : null,
  };
}

/* -------------------------------------------------------------------------- */
/* Service functions                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Counts for the summary cards.
 * GET /interventions/overview
 * → { counts: { OPEN, IN_PROGRESS, COMPLETED, CANCELLED }, open, overdue, dueThisWeek, mine }
 */
export async function getInterventionsOverview() {
  if (!USE_MOCKS) return apiClient('/interventions/overview');

  await mockDelay(250);
  const today = todayISO();
  const weekEnd = addDaysISO(today, 7);
  const user = getMockSessionUser();
  const counts = { OPEN: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 };
  mockInterventionsList.forEach((i) => {
    counts[i.status] += 1;
  });
  const open = mockInterventionsList.filter(isInterventionOpen);
  return {
    counts,
    open: open.length,
    overdue: open.filter((i) => isInterventionOverdue(i, today)).length,
    dueThisWeek: open.filter((i) => i.dueDate >= today && i.dueDate <= weekEnd).length,
    mine: open.filter((i) => i.assignedToId === user?.id).length,
  };
}

/**
 * Interventions with filters. Open ones first (overdue, then by due date),
 * then completed and cancelled, newest first.
 * GET /interventions?status=&priority=&category=&assignedTo=me|<id>&due=overdue|week&studentId=&search=
 * `status` also accepts `active` (OPEN or IN_PROGRESS). `due=week` means open
 * and due within the next 7 days (not yet overdue).
 * → { interventions, total }
 */
export async function getInterventions(filters = {}) {
  const { status = '', priority = '', category = '', assignedTo = '', due = '', dueFrom = '', dueTo = '', studentId = '', search = '' } = filters;
  if (!USE_MOCKS) {
    return apiClient(`/interventions${buildQuery({ status, priority, category, assignedTo, due, dueFrom, dueTo, studentId, search })}`);
  }

  await mockDelay(300);
  const today = todayISO();
  const weekEnd = addDaysISO(today, 7);
  const ownerId = assignedTo === 'me' ? getMockSessionUser()?.id : assignedTo;
  const q = search.trim().toLowerCase();

  const interventions = mockInterventionsList
    .map((i) => present(i, today))
    .filter(
      (i) =>
        (!status || (status === 'active' ? i.isOpen : i.status === status)) &&
        (!priority || i.priority === priority) &&
        (!category || i.category === category) &&
        (!ownerId || i.assignedToId === ownerId) &&
        (!due || (due === 'overdue' ? i.isOverdue : i.isOpen && i.dueDate >= today && i.dueDate <= weekEnd)) &&
        (!dueFrom || (i.dueDate && i.dueDate >= dueFrom)) &&
        (!dueTo || (i.dueDate && i.dueDate <= dueTo)) &&
        (!studentId || i.studentId === studentId) &&
        (!q ||
          i.id.toLowerCase().includes(q) ||
          i.student?.fullName.toLowerCase().includes(q) ||
          i.student?.studentCode.toLowerCase().includes(q) ||
          (i.assignedToName || '').toLowerCase().includes(q))
    )
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        (a.isOpen
          ? Number(b.isOverdue) - Number(a.isOverdue) ||
            (a.dueDate || '9999').localeCompare(b.dueDate || '9999') ||
            PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
          : b.updatedAt.localeCompare(a.updatedAt))
    );

  return { interventions, total: interventions.length };
}

/**
 * One intervention with its full history.
 * GET /interventions/:id
 */
export async function getIntervention(id) {
  if (!USE_MOCKS) return apiClient(`/interventions/${id}`);

  await mockDelay(200);
  return present(findIntervention(id));
}

/**
 * Create an intervention. The student's current risk reasons are copied
 * into `riskSnapshot` so they are kept even after the score changes.
 * POST /interventions
 * body { studentId, category, priority, description, actionPlan, assignedToId, dueDate, followUpDate }
 */
export async function createIntervention(payload) {
  if (!USE_MOCKS) return apiClient('/interventions', { method: 'POST', body: JSON.stringify(payload) });

  await mockDelay(400);
  const details = validateInterventionFields(payload);
  const student = mockStudentsList.find((s) => s.id === payload.studentId);
  if (payload.studentId && !student) details.push({ field: 'studentId', message: 'Student not found.' });
  if (student && student.status !== STUDENT_STATUS.ACTIVE) {
    details.push({ field: 'studentId', message: 'Interventions can only be created for active students.' });
  }
  const owner = payload.assignedToId ? activeStaff(payload.assignedToId) : null;
  if (payload.assignedToId && !owner) details.push({ field: 'assignedToId', message: 'Choose an active staff member.' });
  if (details.length) throw validationError(details);

  const user = getMockSessionUser();
  const risk = mockRiskAssessments.get(student.id);
  const now = new Date().toISOString();
  const intervention = {
    id: nextId(mockInterventionsList, 'INT'),
    studentId: student.id,
    category: payload.category,
    priority: payload.priority || 'MEDIUM',
    status: 'OPEN',
    description: payload.description.trim(),
    actionPlan: (payload.actionPlan || '').trim() || null,
    outcome: null,
    dueDate: payload.dueDate,
    followUpDate: payload.followUpDate || null,
    assignedToId: owner.id,
    assignedToName: owner.name,
    createdById: user?.id ?? null,
    createdByName: user?.name ?? 'Staff',
    createdAt: now,
    updatedAt: now,
    riskSnapshot: risk ? { score: risk.score, category: risk.category, reasons: risk.reasons.map((r) => ({ ...r })) } : null,
    history: [],
  };
  addEvent(intervention, user, 'CREATED');
  mockInterventionsList.unshift(intervention);
  recalculateMockRisk(student.id);
  return present(intervention);
}

/**
 * Update the plan, owner, priority or dates, optionally with a note.
 * Sending only `note` adds a progress note to the history.
 * PATCH /interventions/:id
 */
export async function updateIntervention(id, changes) {
  if (!USE_MOCKS) return apiClient(`/interventions/${id}`, { method: 'PATCH', body: JSON.stringify(changes) });

  await mockDelay(350);
  const intervention = findIntervention(id);
  const user = requireManage(intervention);
  if (!isInterventionOpen(intervention) && Object.keys(changes).some((k) => k !== 'note')) {
    throw new ApiError({
      status: 409,
      code: 'INTERVENTION_CLOSED',
      message: 'Reopen this intervention before changing its plan.',
    });
  }

  const { note, ...fields } = changes;
  const merged = { ...intervention, ...fields };
  const details = validateInterventionFields(
    { ...fields, ...(fields.dueDate !== undefined || fields.followUpDate !== undefined ? { dueDate: merged.dueDate, followUpDate: merged.followUpDate } : {}) },
    { partial: true }
  );
  let owner = null;
  if (fields.assignedToId && fields.assignedToId !== intervention.assignedToId) {
    owner = activeStaff(fields.assignedToId);
    if (!owner) details.push({ field: 'assignedToId', message: 'Choose an active staff member.' });
  }
  const noteText = (note || '').trim();
  if (note !== undefined && Object.keys(fields).length === 0 && noteText.length < 3) {
    details.push({ field: 'note', message: 'Write a note first.' });
  }
  if (details.length) throw validationError(details);

  const planChanged = ['description', 'actionPlan', 'priority', 'category', 'dueDate', 'followUpDate'].filter(
    (k) => fields[k] !== undefined && (fields[k] || null) !== (intervention[k] || null)
  );
  planChanged.forEach((k) => {
    intervention[k] = typeof fields[k] === 'string' ? fields[k].trim() || null : fields[k];
  });
  if (owner) {
    addEvent(intervention, user, 'REASSIGNED', { note: `Owner changed from ${intervention.assignedToName} to ${owner.name}.` });
    intervention.assignedToId = owner.id;
    intervention.assignedToName = owner.name;
  }
  if (planChanged.length) addEvent(intervention, user, 'UPDATED', { fields: planChanged, ...(noteText ? { note: noteText } : {}) });
  else if (noteText) addEvent(intervention, user, 'NOTE', { note: noteText });

  if (planChanged.includes('dueDate')) recalculateMockRisk(intervention.studentId);
  return present(intervention);
}

/**
 * Change status. COMPLETED needs an outcome; CANCELLED and reopening need a note.
 * PATCH /interventions/:id/status  body { status, outcome?, note? }
 */
export async function changeInterventionStatus(id, { status, outcome, note }) {
  if (!USE_MOCKS) {
    return apiClient(`/interventions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, outcome, note }) });
  }

  await mockDelay(350);
  const intervention = findIntervention(id);
  const user = requireManage(intervention);
  const details = validateStatusChange(intervention.status, { status, outcome, note });
  if (details.length) throw validationError(details);

  const fromStatus = intervention.status;
  intervention.status = status;
  if (status === 'COMPLETED') intervention.outcome = outcome.trim();
  addEvent(intervention, user, 'STATUS_CHANGED', {
    fromStatus,
    toStatus: status,
    ...((note || '').trim() ? { note: note.trim() } : {}),
  });
  recalculateMockRisk(intervention.studentId);
  return present(intervention);
}
