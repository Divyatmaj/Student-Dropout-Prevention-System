import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarCheck, ClipboardCheck, AlertTriangle, TrendingDown, Users, Info } from 'lucide-react';
import { ATTENDANCE_THRESHOLDS } from '@udaan/shared';

import StatCard from '../components/common/StatCard.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import ClassRegister from '../components/attendance/ClassRegister.jsx';
import AttendanceRecords from '../components/attendance/AttendanceRecords.jsx';
import '../components/common/common.css';

import { getAttendanceOverview } from '../services/attendanceService.js';
import { useAuth } from '../hooks/useAuth.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { formatClass, formatDate, formatPercent, attendanceTone } from '../utils/formatters.js';

const PERIODS = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
];

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function Attendance() {
  const { can } = useAuth();
  const canRecord = can(PERMISSIONS.ATTENDANCE_RECORD);
  const [searchParams, setSearchParams] = useSearchParams();

  const tabs = [
    ...(canRecord ? [{ id: 'register', label: 'Take Attendance' }] : []),
    { id: 'records', label: 'Records' },
    { id: 'overview', label: 'Class Overview' },
  ];
  const requestedTab = searchParams.get('tab');
  const activeTab = tabs.some((t) => t.id === requestedTab) ? requestedTab : tabs[0].id;

  const [periodDays, setPeriodDays] = useState(30);
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(null);

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      setOverview(await getAttendanceOverview({ from: daysAgo(periodDays) }));
    } catch (err) {
      setOverviewError(err.message || 'Could not load the attendance overview.');
    } finally {
      setOverviewLoading(false);
    }
  }, [periodDays]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const selectTab = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', id);
    next.delete('search');
    setSearchParams(next, { replace: true });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Attendance</h2>
          <p className="page-description">
            Take the daily class register, correct entries and spot students whose attendance needs a
            conversation.
          </p>
        </div>
        <select
          className="filter-select"
          value={periodDays}
          onChange={(e) => setPeriodDays(Number(e.target.value))}
          aria-label="Overview period"
        >
          {PERIODS.map((p) => (
            <option key={p.days} value={p.days}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      {overviewError && !overview && (
        <ErrorState title="Unable to Load Attendance Summary" message={overviewError} onRetry={loadOverview} />
      )}
      {overview && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
            opacity: overviewLoading ? 0.6 : 1,
            transition: 'opacity 0.2s',
          }}
          aria-busy={overviewLoading}
        >
          <StatCard
            title="School Attendance"
            value={formatPercent(overview.schoolAttendanceRate)}
            icon={CalendarCheck}
            badgeText={`Goal: ${ATTENDANCE_THRESHOLDS.moderate}%+`}
            badgeType={overview.schoolAttendanceRate >= ATTENDANCE_THRESHOLDS.moderate ? 'low' : 'medium'}
            subtitle={`${overview.activeStudents} active students`}
          />
          <StatCard
            title="Latest Register"
            value={overview.latestDay ? `${overview.latestDay.marked}/${overview.latestDay.total}` : '—'}
            icon={ClipboardCheck}
            iconColor="#0369a1"
            iconBg="#e0f2fe"
            subtitle={overview.latestDay ? `Students marked on ${formatDate(overview.latestDay.date)}` : 'Nothing recorded yet'}
          />
          <StatCard
            title={`Below ${ATTENDANCE_THRESHOLDS.low}%`}
            value={overview.studentsBelowThreshold}
            icon={TrendingDown}
            iconColor="var(--color-risk-high)"
            iconBg="var(--color-risk-high-subtle)"
            badgeType="high"
            badgeText="+30 risk points"
            subtitle="students this period"
          />
          <StatCard
            title="3+ Absences in a Row"
            value={overview.studentsWithAbsenceStreak}
            icon={AlertTriangle}
            iconColor="var(--color-risk-medium)"
            iconBg="var(--color-risk-medium-subtle)"
            badgeType="medium"
            badgeText="Follow up"
            subtitle="ending on latest recorded day"
          />
        </div>
      )}

      <div className="tabs" role="tablist" aria-label="Attendance sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => selectTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'register' && <ClassRegister onSaved={loadOverview} />}
        {activeTab === 'records' && (
          <AttendanceRecords initialSearch={searchParams.get('search') || ''} onChanged={loadOverview} />
        )}
        {activeTab === 'overview' && (
          <ClassOverview overview={overview} loading={overviewLoading && !overview} />
        )}
      </div>
    </div>
  );
}

function ClassOverview({ overview, loading }) {
  if (loading || !overview) return <LoadingState message="Loading class overview..." />;

  return (
    <>
    <div className="grid-2" style={{ marginBottom: '24px' }}>
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Users size={18} color="var(--color-primary)" />
              Attendance by Class
            </h3>
            <p className="card-subtitle">
              {formatDate(overview.period.from)} – {formatDate(overview.period.to)}
            </p>
          </div>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {overview.classRates.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>No classes with active students.</p>
          )}
          {overview.classRates.map((cls) => (
            <div key={`${cls.grade}-${cls.section}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600 }}>
                  {formatClass(cls.grade, cls.section)}{' '}
                  <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>
                    · {cls.students} student{cls.students === 1 ? '' : 's'}
                  </span>
                </span>
                <span style={{ fontWeight: 700, color: attendanceTone(cls.attendanceRate) }}>
                  {cls.attendanceRate === null ? 'No records' : formatPercent(cls.attendanceRate)}
                </span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--color-bg-muted)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${cls.attendanceRate ?? 0}%`,
                    height: '100%',
                    backgroundColor: attendanceTone(cls.attendanceRate),
                    borderRadius: 'var(--radius-full)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <AlertTriangle size={18} color="var(--color-risk-medium)" />
              Students to Follow Up
            </h3>
            <p className="card-subtitle">
              Attendance below {ATTENDANCE_THRESHOLDS.low}% or 3+ recorded absences in a row.
            </p>
          </div>
        </div>
        <div className="card-body">
          {overview.attention.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '16px' }}>
              No students currently meet these attendance concerns.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Attendance</th>
                    <th style={{ whiteSpace: 'nowrap' }}>Absent in a row</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.attention.map((s) => (
                    <tr key={s.studentId}>
                      <td>
                        <Link to={`/students/${s.studentId}`} style={{ fontWeight: 600, color: 'var(--color-primary-dark)', textDecoration: 'none' }}>
                          {s.studentName}
                        </Link>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          {s.studentCode} · {formatClass(s.grade, s.section)}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: attendanceTone(s.attendancePercentage) }}>
                        {formatPercent(s.attendancePercentage)}
                      </td>
                      <td style={{ fontWeight: 600, color: s.consecutiveAbsences >= 3 ? 'var(--color-risk-high)' : 'var(--color-text-secondary)' }}>
                        {s.consecutiveAbsences} day{s.consecutiveAbsences === 1 ? '' : 's'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>

      <div className="alert alert-info">
        <Info size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>
          How attendance is calculated: <strong>late</strong> counts as attended, <strong>excused</strong> days
          are left out of the percentage, and days with no record are never counted as absences.
          Consecutive absences count recorded school days, not calendar days.
        </span>
      </div>
    </>
  );
}
