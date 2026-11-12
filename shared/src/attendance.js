/**
 * Attendance rules shared by the Udaan web app and API.
 *
 * Udaan's declared attendance policy:
 *   - One record per student per school day: PRESENT, ABSENT, LATE or EXCUSED.
 *   - LATE counts as attended.
 *   - EXCUSED days are left out of the percentage entirely (neither attended
 *     nor missed), so an excused absence never lowers a student's rate.
 *   - Days with no record are NOT treated as absences — they are simply not
 *     counted. Attendance % = (PRESENT + LATE) / (PRESENT + LATE + ABSENT).
 *   - Consecutive absences are counted over the latest recorded school days
 *     (not calendar days). Any non-ABSENT record ends the streak.
 */

export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

export const ATTENDANCE_REASON_CATEGORIES = [
  'ILLNESS',
  'TRANSPORT',
  'FAMILY_EMERGENCY',
  'APPOINTMENT',
  'OTHER',
];

export const ATTENDANCE_REASON_LABELS = {
  ILLNESS: 'Illness',
  TRANSPORT: 'Transport',
  FAMILY_EMERGENCY: 'Family emergency',
  APPOINTMENT: 'Appointment',
  OTHER: 'Other',
};

export const ATTENDANCE_STATUS_LABELS = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LATE: 'Late',
  EXCUSED: 'Excused',
};

export const ATTENDANCE_POLICY = Object.freeze({
  lateCountsAsAttended: true,
  excusedExcludedFromPercentage: true,
  missingDaysCountAsAbsent: false,
});

/** Thresholds used by the risk rules and colour coding. */
export const ATTENDANCE_THRESHOLDS = Object.freeze({
  low: 75, // below this: high concern
  moderate: 85, // below this: moderate concern
});

/** Round to one decimal place. */
function round1(value) {
  return Math.round(value * 10) / 10;
}

/** Date value → comparable YYYY-MM-DD string. */
function dateKey(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

/**
 * Number of consecutive ABSENT records ending at the latest recorded day.
 * @param {{date: string|Date, status: string}[]} records  any order
 */
export function countConsecutiveAbsences(records = []) {
  const sorted = [...records].sort((a, b) => (dateKey(a.date) < dateKey(b.date) ? 1 : -1));
  let streak = 0;
  for (const record of sorted) {
    if (record.status !== 'ABSENT') break;
    streak += 1;
  }
  return streak;
}

/**
 * Attendance percentage under the Udaan policy, or null when there are no
 * eligible (non-excused) recorded days.
 */
export function calculateAttendancePercentage(records = []) {
  let attended = 0;
  let eligible = 0;
  for (const { status } of records) {
    if (status === 'EXCUSED') continue;
    if (status === 'PRESENT' || status === 'LATE') attended += 1;
    if (status === 'PRESENT' || status === 'LATE' || status === 'ABSENT') eligible += 1;
  }
  return eligible === 0 ? null : round1((attended / eligible) * 100);
}

/**
 * Full attendance summary for one student.
 * @returns {{
 *   recordedDays: number, eligibleDays: number,
 *   present: number, absent: number, late: number, excused: number,
 *   attendancePercentage: number|null, consecutiveAbsences: number,
 *   latestRecordedDate: string|null
 * }}
 */
export function summarizeAttendance(records = []) {
  const counts = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
  let latest = null;
  for (const record of records) {
    if (counts[record.status] === undefined) continue;
    counts[record.status] += 1;
    const key = dateKey(record.date);
    if (!latest || key > latest) latest = key;
  }

  return {
    recordedDays: counts.PRESENT + counts.ABSENT + counts.LATE + counts.EXCUSED,
    eligibleDays: counts.PRESENT + counts.ABSENT + counts.LATE,
    present: counts.PRESENT,
    absent: counts.ABSENT,
    late: counts.LATE,
    excused: counts.EXCUSED,
    attendancePercentage: calculateAttendancePercentage(records),
    consecutiveAbsences: countConsecutiveAbsences(records),
    latestRecordedDate: latest,
  };
}
