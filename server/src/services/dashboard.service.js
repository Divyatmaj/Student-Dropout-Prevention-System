/**
 * Dashboard figures, always calculated from the stored records.
 *
 * GET /dashboard/overview (admin, principal) — whole school.
 * GET /dashboard/teacher  (teacher)          — the teacher's assigned students.
 * Both return:
 *   { scope: 'SCHOOL' | 'ASSIGNED', period: { from, to, days }, activeStudents,
 *     attendance: { rate, attended, eligible, excused, recordedDays, studentsBelow75 },
 *     risk: { counts, provisional, awaitingReview },
 *     interventions: { open, inProgress, overdue, dueThisWeek, completedInPeriod } }
 *
 * GET /dashboard/attention — medium/high flags and follow-ups due within a
 * week. Follow-ups carry who and when only: descriptions, plans and notes
 * stay on the intervention itself.
 */
import {
  summarizeAttendance,
  needsReview,
  isInterventionOverdue,
  daysOverdue,
  OPEN_INTERVENTION_STATUSES,
  ATTENDANCE_THRESHOLDS,
} from '@udaan/shared';

import { getPrisma } from '../config/prisma.js';
import { fromDbDate, toDbDate, schoolToday, addDays } from '../utils/dates.js';
import { studentScope, isTeacher } from './scope.js';
import { refreshStaleRisk } from './risk.service.js';

const STUDENT_SELECT = { id: true, fullName: true, studentCode: true, grade: true, section: true };

/** Active students in the user's dashboard scope (assigned students for teachers). */
async function scopedStudents(user) {
  return getPrisma().student.findMany({
    where: studentScope(user, { status: 'ACTIVE' }),
    select: { ...STUDENT_SELECT, riskAssessment: true },
  });
}

export async function getOverview(user, { days }) {
  await refreshStaleRisk(user.schoolId);
  const db = getPrisma();
  const today = schoolToday();
  const from = addDays(today, -(days - 1));
  const students = await scopedStudents(user);
  const ids = students.map((s) => s.id);

  const [records, interventions] = await Promise.all([
    db.attendance.findMany({
      where: { studentId: { in: ids }, date: { gte: toDbDate(from), lte: toDbDate(today) } },
      select: { studentId: true, date: true, status: true },
    }),
    db.intervention.findMany({
      where: { schoolId: user.schoolId, studentId: { in: ids } },
      select: { status: true, dueDate: true, updatedAt: true },
    }),
  ]);

  const summary = summarizeAttendance(records);
  const byStudent = new Map(ids.map((id) => [id, []]));
  records.forEach((r) => byStudent.get(r.studentId).push(r));
  const studentsBelow75 = ids.filter((id) => {
    const rate = summarizeAttendance(byStudent.get(id)).attendancePercentage;
    return rate !== null && rate < ATTENDANCE_THRESHOLDS.low;
  }).length;

  const assessments = students.map((s) => s.riskAssessment).filter(Boolean);
  const counts = { HIGH: 0, MEDIUM: 0, LOW: 0, INSUFFICIENT_DATA: 0 };
  assessments.forEach((a) => {
    counts[a.category] += 1;
  });

  const plain = interventions.map((i) => ({ ...i, dueDate: fromDbDate(i.dueDate) }));
  const open = plain.filter((i) => OPEN_INTERVENTION_STATUSES.includes(i.status));
  const weekEnd = addDays(today, 7);

  return {
    scope: isTeacher(user) ? 'ASSIGNED' : 'SCHOOL',
    period: { from, to: today, days },
    activeStudents: students.length,
    attendance: {
      rate: summary.attendancePercentage,
      attended: summary.present + summary.late,
      eligible: summary.eligibleDays,
      excused: summary.excused,
      recordedDays: new Set(records.map((r) => fromDbDate(r.date))).size,
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
      dueThisWeek: open.filter((i) => i.dueDate && i.dueDate >= today && i.dueDate <= weekEnd).length,
      completedInPeriod: plain.filter((i) => i.status === 'COMPLETED' && schoolToday(i.updatedAt) >= from).length,
    },
  };
}

export async function getAttention(user) {
  await refreshStaleRisk(user.schoolId);
  const db = getPrisma();
  const today = schoolToday();
  const students = await scopedStudents(user);
  const byId = new Map(students.map((s) => [s.id, s]));
  const summary = (s) => ({ id: s.id, fullName: s.fullName, studentCode: s.studentCode, grade: s.grade, section: s.section });

  const open = await db.intervention.findMany({
    where: { schoolId: user.schoolId, studentId: { in: [...byId.keys()] }, status: { in: OPEN_INTERVENTION_STATUSES } },
    select: { id: true, studentId: true, category: true, priority: true, status: true, dueDate: true, assignedToId: true, assignedTo: { select: { name: true } } },
  });
  const openCount = new Map();
  open.forEach((i) => openCount.set(i.studentId, (openCount.get(i.studentId) || 0) + 1));

  const flagged = students
    .filter((s) => s.riskAssessment && (s.riskAssessment.category === 'HIGH' || s.riskAssessment.category === 'MEDIUM'))
    .map((s) => ({
      student: summary(s),
      score: s.riskAssessment.score,
      category: s.riskAssessment.category,
      dataStatus: s.riskAssessment.dataStatus,
      topReason: s.riskAssessment.reasons?.[0]?.label ?? null,
      changedAt: s.riskAssessment.changedAt,
      needsReview: needsReview(s.riskAssessment),
      openInterventions: openCount.get(s.id) || 0,
    }))
    .sort((a, b) => (a.category === b.category ? b.score - a.score : a.category === 'HIGH' ? -1 : 1));

  const weekEnd = addDays(today, 7);
  const followUps = open
    .map((i) => ({ ...i, dueDate: fromDbDate(i.dueDate) }))
    .filter((i) => i.dueDate && i.dueDate <= weekEnd)
    .map((i) => ({
      id: i.id,
      student: summary(byId.get(i.studentId)),
      category: i.category,
      priority: i.priority,
      status: i.status,
      dueDate: i.dueDate,
      assignedToId: i.assignedToId,
      assignedToName: i.assignedTo?.name ?? null,
      isOverdue: isInterventionOverdue(i, today),
      daysOverdue: daysOverdue(i, today),
    }))
    .sort((a, b) => Number(b.isOverdue) - Number(a.isOverdue) || a.dueDate.localeCompare(b.dueDate));

  return { students: flagged, followUps };
}
