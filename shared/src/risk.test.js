import { describe, it, expect } from 'vitest';
import { calculateRisk, assessStudentRisk } from './risk.js';
import { calculateAcademicDecline, toPercentage, validateScore, averagePercentage } from './academics.js';

const base = {
  attendancePercentage: 95,
  eligibleSchoolDays: 20,
  consecutiveAbsences: 0,
  academicDecline: null,
  hasAcademicData: true,
  financialBarrierReported: false,
  overdueInterventions: 0,
};

const codes = (result) => result.reasons.map((r) => r.code).sort();

describe('calculateRisk — attendance bands', () => {
  it('gives no points at 85% or above', () => {
    expect(calculateRisk({ ...base, attendancePercentage: 85 }).score).toBe(0);
  });

  it('gives +15 from 75% to below 85%', () => {
    const r = calculateRisk({ ...base, attendancePercentage: 84.9 });
    expect(r.score).toBe(15);
    expect(codes(r)).toEqual(['MODERATE_ATTENDANCE']);
  });

  it('gives +30 (not +45) below 75%', () => {
    const r = calculateRisk({ ...base, attendancePercentage: 74.9 });
    expect(r.score).toBe(30);
    expect(codes(r)).toEqual(['LOW_ATTENDANCE']);
  });

  it('treats exactly 75% as the moderate band', () => {
    expect(calculateRisk({ ...base, attendancePercentage: 75 }).score).toBe(15);
  });
});

describe('calculateRisk — absence streaks', () => {
  it.each([
    [2, 0],
    [3, 15],
    [4, 15],
    [5, 25],
    [9, 25],
  ])('%i consecutive absences → %i points', (streak, points) => {
    expect(calculateRisk({ ...base, consecutiveAbsences: streak }).score).toBe(points);
  });
});

describe('calculateRisk — academic decline', () => {
  it.each([
    [9.9, 0],
    [10, 10],
    [19.9, 10],
    [20, 20],
    [-15, 0],
  ])('a drop of %f points → %i points', (drop, points) => {
    expect(calculateRisk({ ...base, academicDecline: { drop, subject: 'Maths' } }).score).toBe(points);
  });

  it('names the subject in the reason', () => {
    const r = calculateRisk({ ...base, academicDecline: { drop: 22, subject: 'Science' } });
    expect(r.reasons[0].label).toContain('Science');
  });
});

describe('calculateRisk — categories and caps', () => {
  it('maps 24 → LOW, 25 → MEDIUM, 49 → MEDIUM, 50 → HIGH', () => {
    // 15 + 10 = 25
    expect(calculateRisk({ ...base, attendancePercentage: 80, financialBarrierReported: true }).category).toBe('MEDIUM');
    // 10 + 10 = 20
    expect(calculateRisk({ ...base, financialBarrierReported: true, overdueInterventions: 1 }).category).toBe('LOW');
    // 30 + 10 + 10 = 50
    expect(
      calculateRisk({ ...base, attendancePercentage: 60, financialBarrierReported: true, overdueInterventions: 2 }).category
    ).toBe('HIGH');
  });

  it('adds every indicator together and caps at 100', () => {
    const r = calculateRisk({
      ...base,
      attendancePercentage: 50,
      consecutiveAbsences: 6,
      academicDecline: { drop: 30, subject: 'Maths' },
      financialBarrierReported: true,
      overdueInterventions: 1,
    });
    expect(r.score).toBe(95); // 30 + 25 + 20 + 10 + 10
    expect(r.category).toBe('HIGH');
    expect(r.reasons.map((x) => x.points)).toEqual([30, 25, 20, 10, 10]); // sorted by weight
  });

  it('always requires human review', () => {
    expect(calculateRisk(base).humanReviewRequired).toBe(true);
  });
});

describe('calculateRisk — data completeness', () => {
  it('is COMPLETE with 10+ eligible days and marks', () => {
    expect(calculateRisk({ ...base, eligibleSchoolDays: 10 }).dataStatus).toBe('COMPLETE');
  });

  it('is PROVISIONAL with fewer than 10 eligible days', () => {
    const r = calculateRisk({ ...base, eligibleSchoolDays: 3 });
    expect(r.dataStatus).toBe('PROVISIONAL');
    expect(r.dataGaps[0]).toContain('3 eligible school days');
  });

  it('is PROVISIONAL with no marks, but still categorised from attendance', () => {
    const r = calculateRisk({ ...base, attendancePercentage: 60, hasAcademicData: false });
    expect(r.dataStatus).toBe('PROVISIONAL');
    expect(r.category).toBe('MEDIUM');
  });

  it('is INSUFFICIENT_DATA (never LOW) when there is no usable signal', () => {
    const r = calculateRisk({ ...base, attendancePercentage: null, eligibleSchoolDays: 0, hasAcademicData: false });
    expect(r.dataStatus).toBe('INSUFFICIENT_DATA');
    expect(r.category).toBe('INSUFFICIENT_DATA');
  });

  it('counts a reported financial barrier as a usable signal', () => {
    const r = calculateRisk({
      ...base,
      attendancePercentage: null,
      eligibleSchoolDays: 0,
      hasAcademicData: false,
      financialBarrierReported: true,
    });
    expect(r.dataStatus).toBe('PROVISIONAL');
    expect(r.category).toBe('LOW');
  });
});

describe('assessStudentRisk — from raw records', () => {
  const days = (statuses) =>
    statuses.map((status, i) => ({ date: `2026-10-${String(10 + i).padStart(2, '0')}`, status }));

  it('derives attendance, streak, decline and overdue interventions', () => {
    const r = assessStudentRisk({
      attendance: days(['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'ABSENT', 'ABSENT']),
      marks: [
        { subject: 'Maths', assessmentDate: '2026-08-10', score: 40, maxMarks: 50 }, // 80%
        { subject: 'Maths', assessmentDate: '2026-10-10', score: 15, maxMarks: 25 }, // 60%
      ],
      financialBarrierReported: false,
      interventions: [
        { status: 'OPEN', dueDate: '2026-10-01' }, // overdue
        { status: 'COMPLETED', dueDate: '2026-09-01' }, // closed
        { status: 'IN_PROGRESS', dueDate: '2026-12-01' }, // not yet due
      ],
      today: '2026-11-06',
    });
    expect(r.indicators.attendancePercentage).toBe(70);
    expect(r.indicators.consecutiveAbsences).toBe(3);
    expect(r.indicators.overdueInterventions).toBe(1);
    expect(codes(r)).toEqual(['ABSENCE_STREAK_3_4', 'ACADEMIC_DECLINE_20_PLUS', 'LOW_ATTENDANCE', 'OVERDUE_INTERVENTION']);
    expect(r.score).toBe(75);
    expect(r.category).toBe('HIGH');
    expect(r.dataStatus).toBe('COMPLETE');
  });

  it('returns INSUFFICIENT_DATA for a student with no records', () => {
    expect(assessStudentRisk({ today: '2026-11-06' }).category).toBe('INSUFFICIENT_DATA');
  });
});

describe('academics helpers', () => {
  it('converts scores to percentages and rejects invalid ones', () => {
    expect(toPercentage(18, 25)).toBe(72);
    expect(toPercentage(26, 25)).toBeNull();
    expect(toPercentage(-1, 25)).toBeNull();
  });

  it('validates scores against max marks', () => {
    expect(validateScore('', 50)).toBe('Enter a score.');
    expect(validateScore('abc', 50)).toBe('Score must be a number.');
    expect(validateScore(51, 50)).toBe('Score cannot be more than 50.');
    expect(validateScore(0, 50)).toBeNull();
  });

  it('only compares the same subject and picks the worst decline', () => {
    const decline = calculateAcademicDecline([
      { subject: 'Maths', assessmentDate: '2026-08-01', score: 45, maxMarks: 50 }, // 90
      { subject: 'Science', assessmentDate: '2026-09-01', score: 10, maxMarks: 50 }, // 20 (single result)
      { subject: 'Maths', assessmentDate: '2026-10-01', score: 35, maxMarks: 50 }, // 70
      { subject: 'English', assessmentDate: '2026-08-01', score: 20, maxMarks: 25 }, // 80
      { subject: 'English', assessmentDate: '2026-10-01', score: 18, maxMarks: 25 }, // 72
    ]);
    expect(decline).toEqual({ drop: 20, subject: 'Maths', previous: 90, latest: 70 });
  });

  it('uses only the latest two results in a subject', () => {
    const decline = calculateAcademicDecline([
      { subject: 'Maths', assessmentDate: '2026-07-01', score: 50, maxMarks: 50 }, // 100 (ignored)
      { subject: 'Maths', assessmentDate: '2026-08-01', score: 30, maxMarks: 50 }, // 60
      { subject: 'Maths', assessmentDate: '2026-10-01', score: 32, maxMarks: 50 }, // 64
    ]);
    expect(decline.drop).toBe(-4);
  });

  it('returns null without two results in any subject', () => {
    expect(calculateAcademicDecline([{ subject: 'Maths', assessmentDate: '2026-08-01', score: 1, maxMarks: 2 }])).toBeNull();
  });

  it('averages percentages across different scales', () => {
    expect(averagePercentage([{ score: 20, maxMarks: 25 }, { score: 30, maxMarks: 50 }])).toBe(70);
    expect(averagePercentage([])).toBeNull();
  });
});

describe('needsReview', () => {
  it('flags unreviewed medium/high assessments only', async () => {
    const { needsReview } = await import('./risk.js');
    expect(needsReview({ category: 'HIGH', reviewedAt: null })).toBe(true);
    expect(needsReview({ category: 'LOW', reviewedAt: null })).toBe(false);
    expect(needsReview({ category: 'INSUFFICIENT_DATA', reviewedAt: null })).toBe(false);
  });

  it('flags a review older than the last change', async () => {
    const { needsReview } = await import('./risk.js');
    const changedAt = '2026-11-07T10:00:00.000Z';
    expect(needsReview({ category: 'MEDIUM', changedAt, reviewedAt: '2026-11-06T09:00:00.000Z' })).toBe(true);
    expect(needsReview({ category: 'MEDIUM', changedAt, reviewedAt: '2026-11-08T09:00:00.000Z' })).toBe(false);
    expect(needsReview({ category: 'MEDIUM', changedAt: new Date(changedAt), reviewedAt: new Date('2026-11-08') })).toBe(false);
  });
});
