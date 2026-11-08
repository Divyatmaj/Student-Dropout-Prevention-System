/**
 * Intervention rules shared by the Udaan web app and API.
 *
 * An intervention is a time-bound support action owned by one staff member.
 * It stays "open" (OPEN or IN_PROGRESS) until it is COMPLETED with an
 * outcome, or CANCELLED with a reason. An open intervention whose due date
 * has passed is overdue — this also feeds the OVERDUE_INTERVENTION risk rule.
 */

export const INTERVENTION_STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
export const OPEN_INTERVENTION_STATUSES = ['OPEN', 'IN_PROGRESS'];
export const INTERVENTION_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
export const CONCERN_CATEGORIES = ['ATTENDANCE', 'ACADEMIC', 'FINANCIAL', 'ACCESSIBILITY', 'FAMILY', 'OTHER'];

/** Minimum length for an outcome or a cancellation reason. */
export const MIN_OUTCOME_LENGTH = 10;

/** Which status changes are allowed from each status. */
export const INTERVENTION_TRANSITIONS = Object.freeze({
  OPEN: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  IN_PROGRESS: ['OPEN', 'COMPLETED', 'CANCELLED'],
  COMPLETED: ['IN_PROGRESS'], // reopen
  CANCELLED: ['OPEN'], // reopen
});

const dateKey = (value) => (value ? String(value).slice(0, 10) : null);

export function isInterventionOpen(intervention) {
  return OPEN_INTERVENTION_STATUSES.includes(intervention?.status);
}

/** Open and the due date is before `today` (YYYY-MM-DD). Due today is not overdue. */
export function isInterventionOverdue(intervention, today) {
  const due = dateKey(intervention?.dueDate);
  return Boolean(isInterventionOpen(intervention) && due && due < dateKey(today));
}

/** Whole days an open intervention is past due (0 when not overdue). */
export function daysOverdue(intervention, today) {
  if (!isInterventionOverdue(intervention, today)) return 0;
  const ms = new Date(`${dateKey(today)}T00:00:00Z`) - new Date(`${dateKey(intervention.dueDate)}T00:00:00Z`);
  return Math.round(ms / 86400000);
}

/**
 * Validate a status change.
 * Completing needs an outcome; cancelling and reopening need a note.
 * @returns {{field, message}[]} empty when valid
 */
export function validateStatusChange(currentStatus, { status, outcome, note } = {}) {
  const errors = [];
  if (!INTERVENTION_STATUSES.includes(status)) {
    return [{ field: 'status', message: 'Choose a valid status.' }];
  }
  if (status === currentStatus) {
    return [{ field: 'status', message: 'The intervention already has this status.' }];
  }
  if (!(INTERVENTION_TRANSITIONS[currentStatus] || []).includes(status)) {
    return [{ field: 'status', message: `An intervention cannot move from ${currentStatus} to ${status}.` }];
  }

  const outcomeText = (outcome || '').trim();
  const noteText = (note || '').trim();
  if (status === 'COMPLETED' && outcomeText.length < MIN_OUTCOME_LENGTH) {
    errors.push({ field: 'outcome', message: `Describe the outcome (at least ${MIN_OUTCOME_LENGTH} characters).` });
  }
  const reopening = currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED';
  if ((status === 'CANCELLED' || reopening) && noteText.length < MIN_OUTCOME_LENGTH) {
    errors.push({
      field: 'note',
      message: `${status === 'CANCELLED' ? 'Say why it is being cancelled' : 'Say why it is being reopened'} (at least ${MIN_OUTCOME_LENGTH} characters).`,
    });
  }
  return errors;
}

/**
 * Validate the editable fields of an intervention (create or update).
 * `partial` skips required checks for fields that are not present.
 * @returns {{field, message}[]}
 */
export function validateInterventionFields(values = {}, { partial = false } = {}) {
  const errors = [];
  const has = (key) => !partial || values[key] !== undefined;

  if (!partial && !values.studentId) errors.push({ field: 'studentId', message: 'Choose a student.' });
  if (has('category') && !CONCERN_CATEGORIES.includes(values.category)) {
    errors.push({ field: 'category', message: 'Choose a concern category.' });
  }
  if (has('priority') && values.priority !== undefined && !INTERVENTION_PRIORITIES.includes(values.priority)) {
    errors.push({ field: 'priority', message: 'Choose a priority.' });
  }
  if (has('description')) {
    const text = (values.description || '').trim();
    if (text.length < MIN_OUTCOME_LENGTH) {
      errors.push({ field: 'description', message: `Describe the concern (at least ${MIN_OUTCOME_LENGTH} characters).` });
    } else if (text.length > 2000) {
      errors.push({ field: 'description', message: 'Keep the description under 2000 characters.' });
    }
  }
  if (values.actionPlan && values.actionPlan.length > 2000) {
    errors.push({ field: 'actionPlan', message: 'Keep the action plan under 2000 characters.' });
  }
  if (has('assignedToId') && !values.assignedToId) {
    errors.push({ field: 'assignedToId', message: 'Choose who owns this intervention.' });
  }
  if (has('dueDate') && !values.dueDate) {
    errors.push({ field: 'dueDate', message: 'Choose a due date.' });
  }
  const due = dateKey(values.dueDate);
  const followUp = dateKey(values.followUpDate);
  if (due && followUp && followUp < due) {
    errors.push({ field: 'followUpDate', message: 'The follow-up date cannot be before the due date.' });
  }
  return errors;
}
