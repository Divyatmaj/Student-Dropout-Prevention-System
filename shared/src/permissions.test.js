import { describe, it, expect } from 'vitest';
import { can, canManageIntervention, canCorrectAttendance, PERMISSIONS } from './permissions.js';

const admin = { id: 'a', role: 'SCHOOL_ADMIN', isActive: true };
const principal = { id: 'p', role: 'PRINCIPAL', isActive: true };
const teacher = { id: 't', role: 'TEACHER', isActive: true };

describe('can', () => {
  it('only lets school admins manage staff; principals can view', () => {
    expect(can(admin, PERMISSIONS.STAFF_MANAGE)).toBe(true);
    expect(can(principal, PERMISSIONS.STAFF_MANAGE)).toBe(false);
    expect(can(principal, PERMISSIONS.STAFF_VIEW)).toBe(true);
    expect(can(teacher, PERMISSIONS.STAFF_VIEW)).toBe(false);
  });

  it('denies inactive users, unknown permissions and missing users', () => {
    expect(can({ ...admin, isActive: false }, PERMISSIONS.STAFF_VIEW)).toBe(false);
    expect(can(admin, 'NOT_A_PERMISSION')).toBe(false);
    expect(can(null, PERMISSIONS.DASHBOARD_VIEW)).toBe(false);
  });

  it('gives platform admins no school permissions', () => {
    expect(can({ id: 'x', role: 'PLATFORM_ADMIN', isActive: true }, PERMISSIONS.STUDENTS_VIEW)).toBe(false);
  });
});

describe('record-level rules', () => {
  it('teachers manage interventions they created or own; principals and admins manage any', () => {
    const intervention = { createdById: 'someone', assignedToId: 't' };
    expect(canManageIntervention(teacher, intervention)).toBe(true);
    expect(canManageIntervention(teacher, { createdById: 'x', assignedToId: 'y' })).toBe(false);
    expect(canManageIntervention(principal, { createdById: 'x', assignedToId: 'y' })).toBe(true);
  });

  it('teachers correct only attendance they recorded', () => {
    expect(canCorrectAttendance(teacher, { recordedById: 't' })).toBe(true);
    expect(canCorrectAttendance(teacher, { recordedById: 'x' })).toBe(false);
    expect(canCorrectAttendance(principal, { recordedById: 'x' })).toBe(true);
  });
});
