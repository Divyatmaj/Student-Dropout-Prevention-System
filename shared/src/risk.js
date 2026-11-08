/**
 * Udaan's transparent early-warning score (0–100).
 *
 * This is a prioritisation heuristic for staff review — not a prediction and
 * not statistically validated. Thresholds must be calibrated with educators
 * before real use. A score must never be used for punitive or exclusionary
 * action, and sensitive attributes (caste, religion, gender, disability…)
 * are never inputs.
 *
 * Rules (within one indicator the bands are mutually exclusive):
 *   Attendance below 75%                 +30
 *   Attendance 75% to below 85%          +15
 *   3–4 consecutive absent school days   +15
 *   5+ consecutive absent school days    +25
 *   Same-subject decline 10–19.9 points  +10
 *   Same-subject decline 20+ points      +20
 *   Financial barrier reported           +10
 *   Overdue unresolved intervention      +10
 *
 * Category: 0–24 LOW, 25–49 MEDIUM, 50–100 HIGH.
 * Data status: INSUFFICIENT_DATA when there is no usable signal (category is
 * then INSUFFICIENT_DATA, never LOW); PROVISIONAL when fewer than 10 eligible
 * school days are recorded or there are no marks; otherwise COMPLETE.
 */
import { summarizeAttendance, ATTENDANCE_THRESHOLDS } from './attendance.js';
import { calculateAcademicDecline, ACADEMIC_DECLINE_THRESHOLDS } from './academics.js';
import { isInterventionOverdue } from './interventions.js';

export const RISK_CATEGORIES = ['LOW', 'MEDIUM', 'HIGH', 'INSUFFICIENT_DATA'];
export const DATA_STATUSES = ['COMPLETE', 'PROVISIONAL', 'INSUFFICIENT_DATA'];
export const MIN_ELIGIBLE_SCHOOL_DAYS = 10;

export const RISK_CATEGORY_BANDS = Object.freeze({ medium: 25, high: 50 });

/** The rule table, for display in the UI and documentation. */
export const RISK_RULES = Object.freeze([
  { code: 'LOW_ATTENDANCE', indicator: 'Attendance', description: 'Attendance below 75%', points: 30 },
  { code: 'MODERATE_ATTENDANCE', indicator: 'Attendance', description: 'Attendance from 75% to below 85%', points: 15 },
  { code: 'ABSENCE_STREAK_3_4', indicator: 'Consecutive absences', description: '3–4 consecutive absent school days', points: 15 },
  { code: 'ABSENCE_STREAK_5_PLUS', indicator: 'Consecutive absences', description: '5 or more consecutive absent school days', points: 25 },
  { code: 'ACADEMIC_DECLINE_10_PLUS', indicator: 'Academic decline', description: 'Same-subject drop of 10–19.9 percentage points', points: 10 },
  { code: 'ACADEMIC_DECLINE_20_PLUS', indicator: 'Academic decline', description: 'Same-subject drop of 20+ percentage points', points: 20 },
  { code: 'FINANCIAL_BARRIER', indicator: 'Support flag', description: 'Financial barrier reported by family or student', points: 10 },
  { code: 'OVERDUE_INTERVENTION', indicator: 'Interventions', description: 'Open intervention past its due date', points: 10 },
]);

const fmt = (n) => `${Math.round(n * 10) / 10}`;

/**
 * Score a student from pre-computed indicators.
 *
 * @param {{
 *   attendancePercentage: number|null,
 *   eligibleSchoolDays: number,
 *   consecutiveAbsences: number,
 *   academicDecline: { drop: number, subject: string } | null,
 *   hasAcademicData: boolean,
 *   financialBarrierReported: boolean,
 *   overdueInterventions: number,
 * }} indicators
 */
export function calculateRisk(indicators) {
  const {
    attendancePercentage = null,
    eligibleSchoolDays = 0,
    consecutiveAbsences = 0,
    academicDecline = null,
    hasAcademicData = false,
    financialBarrierReported = false,
    overdueInterventions = 0,
  } = indicators;

  const reasons = [];
  const add = (code, points, label) => reasons.push({ code, label, points });

  if (attendancePercentage !== null) {
    if (attendancePercentage < ATTENDANCE_THRESHOLDS.low) {
      add('LOW_ATTENDANCE', 30, `Attendance is ${fmt(attendancePercentage)}% (below 75%)`);
    } else if (attendancePercentage < ATTENDANCE_THRESHOLDS.moderate) {
      add('MODERATE_ATTENDANCE', 15, `Attendance is ${fmt(attendancePercentage)}% (below 85%)`);
    }
  }

  if (consecutiveAbsences >= 5) {
    add('ABSENCE_STREAK_5_PLUS', 25, `${consecutiveAbsences} consecutive absent school days`);
  } else if (consecutiveAbsences >= 3) {
    add('ABSENCE_STREAK_3_4', 15, `${consecutiveAbsences} consecutive absent school days`);
  }

  if (academicDecline && academicDecline.drop >= ACADEMIC_DECLINE_THRESHOLDS.moderate) {
    const label = `${academicDecline.subject} result dropped ${fmt(academicDecline.drop)} percentage points`;
    if (academicDecline.drop >= ACADEMIC_DECLINE_THRESHOLDS.severe) add('ACADEMIC_DECLINE_20_PLUS', 20, label);
    else add('ACADEMIC_DECLINE_10_PLUS', 10, label);
  }

  if (financialBarrierReported) {
    add('FINANCIAL_BARRIER', 10, 'A financial barrier was reported');
  }

  if (overdueInterventions > 0) {
    add(
      'OVERDUE_INTERVENTION',
      10,
      overdueInterventions === 1
        ? 'An open intervention is past its due date'
        : `${overdueInterventions} open interventions are past their due date`
    );
  }

  const score = Math.min(100, reasons.reduce((sum, r) => sum + r.points, 0));
  reasons.sort((a, b) => b.points - a.points);

  const usableSignals =
    (attendancePercentage !== null ? 1 : 0) + (hasAcademicData ? 1 : 0) + (financialBarrierReported ? 1 : 0);

  const missing = [];
  if (eligibleSchoolDays < MIN_ELIGIBLE_SCHOOL_DAYS) {
    missing.push(`only ${eligibleSchoolDays} eligible school day${eligibleSchoolDays === 1 ? '' : 's'} recorded (needs ${MIN_ELIGIBLE_SCHOOL_DAYS})`);
  }
  if (!hasAcademicData) missing.push('no marks recorded');

  const dataStatus =
    usableSignals === 0 ? 'INSUFFICIENT_DATA' : missing.length > 0 ? 'PROVISIONAL' : 'COMPLETE';

  const category =
    dataStatus === 'INSUFFICIENT_DATA'
      ? 'INSUFFICIENT_DATA'
      : score >= RISK_CATEGORY_BANDS.high
        ? 'HIGH'
        : score >= RISK_CATEGORY_BANDS.medium
          ? 'MEDIUM'
          : 'LOW';

  return {
    // Always a number (stored as Int). When dataStatus is INSUFFICIENT_DATA the
    // UI shows the category instead of the score.
    score,
    category,
    dataStatus,
    dataGaps: missing,
    reasons,
    humanReviewRequired: true,
  };
}

/**
 * Build indicators from raw records, then score them.
 *
 * @param {object} input
 * @param {{date, status}[]} input.attendance
 * @param {{subject, assessmentDate, score, maxMarks}[]} input.marks
 * @param {boolean} input.financialBarrierReported
 * @param {{status, dueDate}[]} input.interventions
 * @param {string} input.today  YYYY-MM-DD, used to decide what is overdue
 */
export function assessStudentRisk({
  attendance = [],
  marks = [],
  financialBarrierReported = false,
  interventions = [],
  today,
}) {
  const att = summarizeAttendance(attendance);
  const decline = calculateAcademicDecline(marks);
  const overdueInterventions = interventions.filter((i) => isInterventionOverdue(i, today)).length;

  const indicators = {
    attendancePercentage: att.attendancePercentage,
    eligibleSchoolDays: att.eligibleDays,
    consecutiveAbsences: att.consecutiveAbsences,
    academicDecline: decline,
    hasAcademicData: marks.length > 0,
    financialBarrierReported: Boolean(financialBarrierReported),
    overdueInterventions,
  };

  return { ...calculateRisk(indicators), indicators };
}
