import { describe, it, expect } from 'vitest';
import {
  calculateAttendancePercentage,
  countConsecutiveAbsences,
  summarizeAttendance,
} from './attendance.js';

const rec = (date, status) => ({ date, status });

describe('calculateAttendancePercentage', () => {
  it('returns null when nothing is recorded', () => {
    expect(calculateAttendancePercentage([])).toBeNull();
  });

  it('returns null when every recorded day is excused', () => {
    expect(calculateAttendancePercentage([rec('2026-11-02', 'EXCUSED')])).toBeNull();
  });

  it('counts late as attended', () => {
    const records = [rec('2026-11-02', 'PRESENT'), rec('2026-11-03', 'LATE'), rec('2026-11-04', 'ABSENT'), rec('2026-11-05', 'ABSENT')];
    expect(calculateAttendancePercentage(records)).toBe(50);
  });

  it('leaves excused days out of the denominator', () => {
    const records = [rec('2026-11-02', 'PRESENT'), rec('2026-11-03', 'EXCUSED'), rec('2026-11-04', 'ABSENT')];
    expect(calculateAttendancePercentage(records)).toBe(50);
  });

  it('rounds to one decimal place', () => {
    const records = [rec('2026-11-02', 'PRESENT'), rec('2026-11-03', 'PRESENT'), rec('2026-11-04', 'ABSENT')];
    expect(calculateAttendancePercentage(records)).toBe(66.7);
  });
});

describe('countConsecutiveAbsences', () => {
  it('counts absences ending at the latest recorded day, regardless of input order', () => {
    const records = [rec('2026-11-06', 'ABSENT'), rec('2026-11-02', 'PRESENT'), rec('2026-11-05', 'ABSENT'), rec('2026-11-04', 'ABSENT')];
    expect(countConsecutiveAbsences(records)).toBe(3);
  });

  it('is zero when the latest day was attended', () => {
    expect(countConsecutiveAbsences([rec('2026-11-05', 'ABSENT'), rec('2026-11-06', 'LATE')])).toBe(0);
  });

  it('treats an excused day as ending the streak', () => {
    const records = [rec('2026-11-06', 'ABSENT'), rec('2026-11-05', 'EXCUSED'), rec('2026-11-04', 'ABSENT')];
    expect(countConsecutiveAbsences(records)).toBe(1);
  });

  it('uses recorded school days, so gaps (weekends, missing days) do not break a streak', () => {
    const records = [rec('2026-11-09', 'ABSENT'), rec('2026-11-06', 'ABSENT')];
    expect(countConsecutiveAbsences(records)).toBe(2);
  });

  it('accepts Date objects', () => {
    expect(countConsecutiveAbsences([{ date: new Date('2026-11-06T00:00:00Z'), status: 'ABSENT' }])).toBe(1);
  });
});

describe('summarizeAttendance', () => {
  it('summarises counts, percentage, streak and latest date', () => {
    const summary = summarizeAttendance([
      rec('2026-11-02', 'PRESENT'),
      rec('2026-11-03', 'LATE'),
      rec('2026-11-04', 'EXCUSED'),
      rec('2026-11-05', 'ABSENT'),
      rec('2026-11-06', 'ABSENT'),
    ]);
    expect(summary).toEqual({
      recordedDays: 5,
      eligibleDays: 4,
      present: 1,
      absent: 2,
      late: 1,
      excused: 1,
      attendancePercentage: 50,
      consecutiveAbsences: 2,
      latestRecordedDate: '2026-11-06',
    });
  });

  it('handles no records', () => {
    expect(summarizeAttendance([])).toMatchObject({
      recordedDays: 0,
      attendancePercentage: null,
      consecutiveAbsences: 0,
      latestRecordedDate: null,
    });
  });
});
