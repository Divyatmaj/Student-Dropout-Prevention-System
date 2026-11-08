/**
 * Academic rules shared by the Udaan web app and API.
 *
 * - Scores are compared as percentages of each assessment's maximum marks,
 *   so tests marked out of 25 and 50 can be compared fairly.
 * - Academic decline compares the latest two assessments in the SAME subject.
 *   Different subjects are never compared with each other.
 * - A drop of 10+ percentage points counts as a decline. This is a
 *   configurable heuristic for the prototype, not an academic standard.
 */

export const ACADEMIC_DECLINE_THRESHOLDS = Object.freeze({
  moderate: 10,
  severe: 20,
});

function round1(value) {
  return Math.round(value * 10) / 10;
}

function dateKey(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

/** Score as a percentage of max marks (one decimal), or null if invalid. */
export function toPercentage(score, maxMarks) {
  const s = Number(score);
  const max = Number(maxMarks);
  if (!Number.isFinite(s) || !Number.isFinite(max) || max <= 0 || s < 0 || s > max) return null;
  return round1((s / max) * 100);
}

/** Validation message for a score, or null when valid. */
export function validateScore(score, maxMarks) {
  if (score === '' || score === null || score === undefined) return 'Enter a score.';
  const s = Number(score);
  if (!Number.isFinite(s)) return 'Score must be a number.';
  if (s < 0) return 'Score cannot be negative.';
  if (s > Number(maxMarks)) return `Score cannot be more than ${maxMarks}.`;
  return null;
}

/**
 * Largest same-subject decline across a student's marks.
 *
 * @param {{subject: string, assessmentDate: string|Date, score: number, maxMarks: number}[]} marks
 * @returns {{ drop: number, subject: string, previous: number, latest: number } | null}
 *   null when no subject has two valid results. `drop` is positive for a
 *   decline and zero or negative when results held steady or improved.
 */
export function calculateAcademicDecline(marks = []) {
  const bySubject = new Map();
  for (const mark of marks) {
    const pct = toPercentage(mark.score, mark.maxMarks);
    if (pct === null || !mark.subject) continue;
    const list = bySubject.get(mark.subject) || [];
    list.push({ date: dateKey(mark.assessmentDate), pct });
    bySubject.set(mark.subject, list);
  }

  let worst = null;
  for (const [subject, list] of bySubject) {
    if (list.length < 2) continue;
    list.sort((a, b) => (a.date < b.date ? 1 : -1));
    const [latest, previous] = list;
    const drop = round1(previous.pct - latest.pct);
    if (!worst || drop > worst.drop) {
      worst = { drop, subject, previous: previous.pct, latest: latest.pct };
    }
  }
  return worst;
}

/** Average percentage across valid marks, or null. */
export function averagePercentage(marks = []) {
  const values = marks.map((m) => toPercentage(m.score, m.maxMarks)).filter((v) => v !== null);
  if (values.length === 0) return null;
  return round1(values.reduce((sum, v) => sum + v, 0) / values.length);
}
