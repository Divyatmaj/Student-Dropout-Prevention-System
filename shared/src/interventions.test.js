import { describe, it, expect } from 'vitest';
import {
  isInterventionOverdue,
  daysOverdue,
  validateStatusChange,
  validateInterventionFields,
} from './interventions.js';

const TODAY = '2026-11-08';

describe('isInterventionOverdue', () => {
  it('is overdue when open and the due date has passed', () => {
    expect(isInterventionOverdue({ status: 'OPEN', dueDate: '2026-11-07' }, TODAY)).toBe(true);
    expect(isInterventionOverdue({ status: 'IN_PROGRESS', dueDate: '2026-11-01T00:00:00.000Z' }, TODAY)).toBe(true);
  });

  it('is not overdue on the due date itself', () => {
    expect(isInterventionOverdue({ status: 'OPEN', dueDate: TODAY }, TODAY)).toBe(false);
  });

  it('is never overdue once completed or cancelled', () => {
    expect(isInterventionOverdue({ status: 'COMPLETED', dueDate: '2026-10-01' }, TODAY)).toBe(false);
    expect(isInterventionOverdue({ status: 'CANCELLED', dueDate: '2026-10-01' }, TODAY)).toBe(false);
  });

  it('accepts Date objects, as the database returns them', () => {
    expect(isInterventionOverdue({ status: 'OPEN', dueDate: new Date('2026-11-06T00:00:00Z') }, TODAY)).toBe(true);
    expect(isInterventionOverdue({ status: 'OPEN', dueDate: new Date('2026-11-08T00:00:00Z') }, TODAY)).toBe(false);
    expect(daysOverdue({ status: 'OPEN', dueDate: new Date('2026-11-01T00:00:00Z') }, TODAY)).toBe(7);
  });

  it('is not overdue without a due date', () => {
    expect(isInterventionOverdue({ status: 'OPEN', dueDate: null }, TODAY)).toBe(false);
  });

  it('counts whole days overdue', () => {
    expect(daysOverdue({ status: 'OPEN', dueDate: '2026-11-01' }, TODAY)).toBe(7);
    expect(daysOverdue({ status: 'OPEN', dueDate: '2026-11-09' }, TODAY)).toBe(0);
  });
});

describe('validateStatusChange', () => {
  it('allows starting work without extra fields', () => {
    expect(validateStatusChange('OPEN', { status: 'IN_PROGRESS' })).toEqual([]);
  });

  it('requires an outcome to complete', () => {
    expect(validateStatusChange('IN_PROGRESS', { status: 'COMPLETED' }).map((e) => e.field)).toEqual(['outcome']);
    expect(validateStatusChange('IN_PROGRESS', { status: 'COMPLETED', outcome: 'Attendance back above 85%.' })).toEqual([]);
  });

  it('requires a reason to cancel', () => {
    expect(validateStatusChange('OPEN', { status: 'CANCELLED', note: 'short' }).map((e) => e.field)).toEqual(['note']);
  });

  it('requires a note to reopen a closed intervention', () => {
    expect(validateStatusChange('COMPLETED', { status: 'IN_PROGRESS' }).map((e) => e.field)).toEqual(['note']);
    expect(validateStatusChange('COMPLETED', { status: 'IN_PROGRESS', note: 'Absences started again this week.' })).toEqual([]);
  });

  it('rejects the same status and disallowed moves', () => {
    expect(validateStatusChange('OPEN', { status: 'OPEN' })).toHaveLength(1);
    expect(validateStatusChange('COMPLETED', { status: 'CANCELLED', note: 'Not needed any more.' })).toHaveLength(1);
    expect(validateStatusChange('OPEN', { status: 'DONE' })).toHaveLength(1);
  });
});

describe('validateInterventionFields', () => {
  const valid = {
    studentId: 'STU-1',
    category: 'ATTENDANCE',
    priority: 'HIGH',
    description: 'Absent five days in a row.',
    assignedToId: 'USR-1',
    dueDate: '2026-11-12',
    followUpDate: '2026-11-19',
  };

  it('accepts a complete intervention', () => {
    expect(validateInterventionFields(valid)).toEqual([]);
  });

  it('requires student, category, description, owner and due date', () => {
    const fields = validateInterventionFields({}).map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['studentId', 'category', 'description', 'assignedToId', 'dueDate']));
  });

  it('rejects a follow-up before the due date', () => {
    expect(validateInterventionFields({ ...valid, followUpDate: '2026-11-10' }).map((e) => e.field)).toEqual(['followUpDate']);
  });

  it('only checks supplied fields on a partial update', () => {
    expect(validateInterventionFields({ actionPlan: 'Weekly call home.' }, { partial: true })).toEqual([]);
    expect(validateInterventionFields({ assignedToId: '' }, { partial: true }).map((e) => e.field)).toEqual(['assignedToId']);
  });
});
