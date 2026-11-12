/**
 * Mock daily attendance for the Udaan web app (used only when VITE_USE_MOCKS=true).
 *
 * One record per student per school day — the same shape as the Udaan API's
 * `Attendance` resource:
 *   { id, studentId, date: 'YYYY-MM-DD', status, reasonCategory, note, recordedById, recordedByName }
 *
 * Contract:
 *   GET    /attendance?date=&from=&to=&grade=&section=&status=&search=
 *          → { records: AttendanceRecord[] (with student fields), total }
 *   GET    /attendance/overview?from=&to=   → see attendanceService.getAttendanceOverview
 *   GET    /attendance/register?date=&grade=&section=
 *          → { date, students: [{ student, record | null }] }
 *   POST   /attendance            body { studentId, date, status, reasonCategory?, note }  (409 on duplicate)
 *   POST   /attendance/bulk       body { date, entries: [{ studentId, status, reasonCategory?, note }] }
 *          → { created, updated, records }  (upsert per student + date)
 *   PATCH  /attendance/:id        body { status?, reasonCategory?, note? }
 *   DELETE /attendance/:id        body { reason }   (school admin only)
 *
 * The records are generated so each student's attendance % matches the
 * story told elsewhere in the mock data (e.g. Rohan's 5-day absence streak).
 */
import { mockStudentsList } from './mockStudentsData.js';

const RECORDERS = {
  'USR-001': 'Radhika Sharma',
  'USR-003': 'Neha Gupta',
};

/** Target attendance % and current absence streak for each mock student. */
const ATTENDANCE_TARGETS = {
  'STU-1042': { rate: 61.9 },
  'STU-1089': { rate: 66.7 },
  'STU-1120': { rate: 71.4, streak: 5 },
  'STU-1194': { rate: 81.0 },
  'STU-1205': { rate: 81.0 },
  'STU-1231': { rate: 76.2, streak: 3 },
  'STU-1011': { rate: 95.2 },
  'STU-1025': { rate: 90.5 },
  'STU-0987': { rate: 85.7, endsOn: '2026-10-09' }, // transferred out
};

const MOCK_TODAY = '2026-11-06'; // last school day with recorded attendance
const SCHOOL_DAYS = 21;

export function toLocalISODate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The last `count` weekdays up to and including `endDate`, newest first. */
function recentSchoolDays(endDate, count) {
  const dates = [];
  const cursor = new Date(`${endDate}T00:00:00`);
  while (dates.length < count) {
    const weekday = cursor.getDay();
    if (weekday !== 0 && weekday !== 6) dates.push(toLocalISODate(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }
  return dates;
}

/** Status pattern (newest first) whose attendance % matches the target. */
function buildStatuses({ rate, streak = 0 }, days) {
  const statuses = Array(days).fill('PRESENT');
  let absences = Math.round((days * (100 - rate)) / 100);

  for (let i = 0; i < streak && absences > 0; i += 1) {
    statuses[i] = 'ABSENT';
    absences -= 1;
  }

  // Spread the remaining absences evenly through the older days,
  // leaving the day after the streak as present so the streak is exact.
  const firstFree = streak + 1;
  const span = days - firstFree;
  for (let n = 0; n < absences; n += 1) {
    statuses[firstFree + Math.floor(((n + 0.5) * span) / absences)] = 'ABSENT';
  }

  // A few late arrivals (still counted as attended).
  for (let i = firstFree + 2; i < days; i += 6) {
    if (statuses[i] === 'PRESENT') statuses[i] = 'LATE';
  }
  return statuses;
}

function generateRecords() {
  const records = [];
  let counter = 1;

  mockStudentsList.forEach((student) => {
    const recordedById = student.assignedTeacherId || 'USR-001';
    const push = (date, status, note = '') =>
      records.push({
        id: `ATT-${String(counter++).padStart(4, '0')}`,
        studentId: student.id,
        date,
        status,
        reasonCategory: null,
        note,
        recordedById,
        recordedByName: RECORDERS[recordedById],
      });

    const target = ATTENDANCE_TARGETS[student.id];
    if (!target) {
      // New admission — only a few days recorded so far.
      recentSchoolDays(MOCK_TODAY, 3).forEach((date, i) =>
        push(date, i === 2 ? 'LATE' : 'PRESENT', i === 2 ? 'Arrived 20 minutes late' : '')
      );
      return;
    }

    const dates = recentSchoolDays(target.endsOn || MOCK_TODAY, SCHOOL_DAYS);
    const statuses = buildStatuses(target, SCHOOL_DAYS);
    dates.forEach((date, i) =>
      push(date, statuses[i], statuses[i] === 'LATE' ? 'Arrived after assembly' : '')
    );
  });

  // One excused day to show the policy in action (left out of the %).
  const excused = records.find((r) => r.studentId === 'STU-1011' && r.date === '2026-10-15');
  if (excused) {
    excused.status = 'EXCUSED';
    excused.reasonCategory = 'ILLNESS';
    excused.note = 'Medical certificate received';
  }

  const transportAbsence = records.find((r) => r.studentId === 'STU-1042' && r.status === 'ABSENT');
  if (transportAbsence) transportAbsence.reasonCategory = 'TRANSPORT';

  return records;
}

/** Mutable in-memory store — services add, edit and remove records here. */
export const mockAttendanceRecords = generateRecords();

export function nextMockAttendanceId() {
  const max = mockAttendanceRecords.reduce(
    (acc, r) => Math.max(acc, Number(r.id.replace(/\D/g, '')) || 0),
    0
  );
  return `ATT-${String(max + 1).padStart(4, '0')}`;
}
