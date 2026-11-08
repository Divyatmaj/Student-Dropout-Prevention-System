import { summarizeAttendance, isInterventionOpen, isInterventionOverdue, daysOverdue } from '@udaan/shared';

import { apiClient, USE_MOCKS, mockDelay, buildQuery } from './api.js';
import { getMockSessionUser } from './authService.js';
import { mockStudentsList } from '../data/mockStudentsData.js';
import { mockAttendanceRecords } from '../data/mockAttendanceData.js';
import { mockInterventionsList } from '../data/mockInterventionsData.js';
import { mockRiskAssessments, needsReview } from '../data/mockRiskStore.js';
import { STUDENT_STATUS } from '../constants/students.js';
import { todayISO, daysAgoISO, addDaysISO } from '../utils/formatters.js';

/*
 * Dashboard figures are always derived from the stored records — never
 * hard-coded. School admins and principals get the whole school
 * (GET /dashboard/overview); teachers get their assigned students
 * (GET /dashboard/teacher). Both return the same shape:
 *
 * {
 *   scope: 'SCHOOL' | 'ASSIGNED',
 *   period: { from, to, days },
 *   activeStudents,
 *   attendance: { rate, attended, eligible, excused, recordedDays, studentsBelow75 },
 *   risk: { counts: { HIGH, MEDIUM, LOW, INSUFFICIENT_DATA }, provisional, awaitingReview },
 *   interventions: { open, inProgress, overdue, dueThisWeek, completedInPeriod }
 * }
 *
 * GET /dashboard/attention → { students: [...], followUps: [...] }
 * lists what needs a person's attention. Follow-ups deliberately leave out
 * descriptions, plans and notes: sensitive details stay on the
 * intervention itself.
 */

export const DASHBOARD_PERIODS = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
];

/* -------------------------------------------------------------------------- */
/* Mock helpers                                                               */
/* -------------------------------------------------------------------------- */

function scopedStudents() {
  const user = getMockSessionUser();
  const active = mockStudentsList.filter((s) => s.status === STUDENT_STATUS.ACTIVE);
  if (user?.role === 'TEACHER') {
    return { scope: 'ASSIGNED', students: active.filter((s) => s.assignedTeacherId === user.id), user };
  }
  return { scope: 'SCHOOL', students: active, user };
}

function studentSummary(s) {
  return { id: s.id, fullName: s.fullName, studentCode: s.studentCode, grade: s.grade, section: s.section };
}

/* -------------------------------------------------------------------------- */
/* Service functions                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Headline figures for the signed-in user's scope.
 * @param {{ days?: number, role?: string }} options
 */
export async function getDashboardOverview({ days = 30, role } = {}) {
  if (!USE_MOCKS) {
    const endpoint = role === 'TEACHER' ? '/dashboard/teacher' : '/dashboard/overview';
    return apiClient(`${endpoint}${buildQuery({ days })}`);
  }

  await mockDelay(350);
  const today = todayISO();
  const from = daysAgoISO(days - 1);
  const { scope, students } = scopedStudents();
  const ids = new Set(students.map((s) => s.id));

  const records = mockAttendanceRecords.filter((r) => ids.has(r.studentId) && r.date >= from && r.date <= today);
  const summary = summarizeAttendance(records);
  const studentsBelow75 = students.filter((s) => {
    const rate = summarizeAttendance(records.filter((r) => r.studentId === s.id)).attendancePercentage;
    return rate !== null && rate < 75;
  }).length;

  const assessments = students.map((s) => mockRiskAssessments.get(s.id)).filter(Boolean);
  const counts = { HIGH: 0, MEDIUM: 0, LOW: 0, INSUFFICIENT_DATA: 0 };
  assessments.forEach((a) => {
    counts[a.category] += 1;
  });

  const interventions = mockInterventionsList.filter((i) => ids.has(i.studentId));
  const open = interventions.filter(isInterventionOpen);
  const weekEnd = addDaysISO(today, 7);

  return {
    scope,
    period: { from, to: today, days },
    activeStudents: students.length,
    attendance: {
      rate: summary.attendancePercentage,
      attended: summary.present + summary.late,
      eligible: summary.eligibleDays,
      excused: summary.excused,
      recordedDays: new Set(records.map((r) => r.date)).size,
      studentsBelow75,
    },
    risk: {
      counts,
      provisional: assessments.filter((a) => a.dataStatus === 'PROVISIONAL').length,
      awaitingReview: assessments.filter(needsReview).length,
    },
    interventions: {
      open: open.filter((i) => i.status === 'OPEN').length,
      inProgress: open.filter((i) => i.status === 'IN_PROGRESS').length,
      overdue: open.filter((i) => isInterventionOverdue(i, today)).length,
      dueThisWeek: open.filter((i) => i.dueDate >= today && i.dueDate <= weekEnd).length,
      completedInPeriod: interventions.filter(
        (i) => i.status === 'COMPLETED' && i.updatedAt.slice(0, 10) >= from
      ).length,
    },
  };
}

/**
 * Who needs attention now: medium/high flags (newest change first) and open
 * interventions that are overdue or due within 7 days.
 * GET /dashboard/attention
 */
export async function getDashboardAttention() {
  if (!USE_MOCKS) return apiClient('/dashboard/attention');

  await mockDelay(300);
  const today = todayISO();
  const weekEnd = addDaysISO(today, 7);
  const { students } = scopedStudents();
  const byId = new Map(students.map((s) => [s.id, s]));

  const flagged = students
    .map((s) => mockRiskAssessments.get(s.id))
    .filter((a) => a && (a.category === 'HIGH' || a.category === 'MEDIUM'))
    .map((a) => {
      const openForStudent = mockInterventionsList.filter((i) => i.studentId === a.studentId && isInterventionOpen(i));
      return {
        student: studentSummary(byId.get(a.studentId)),
        score: a.score,
        category: a.category,
        dataStatus: a.dataStatus,
        topReason: a.reasons[0]?.label ?? null,
        changedAt: a.changedAt,
        needsReview: needsReview(a),
        openInterventions: openForStudent.length,
      };
    })
    .sort((a, b) => (a.category === b.category ? b.score - a.score : a.category === 'HIGH' ? -1 : 1));

  const followUps = mockInterventionsList
    .filter((i) => byId.has(i.studentId) && isInterventionOpen(i) && i.dueDate && i.dueDate <= weekEnd)
    .map((i) => ({
      id: i.id,
      student: studentSummary(byId.get(i.studentId)),
      category: i.category,
      priority: i.priority,
      status: i.status,
      dueDate: i.dueDate,
      assignedToId: i.assignedToId,
      assignedToName: i.assignedToName,
      isOverdue: isInterventionOverdue(i, today),
      daysOverdue: daysOverdue(i, today),
    }))
    .sort((a, b) => Number(b.isOverdue) - Number(a.isOverdue) || a.dueDate.localeCompare(b.dueDate));

  return { students: flagged, followUps };
}
