import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  CalendarCheck,
  ClipboardList,
  RefreshCw,
  PlusCircle,
  ShieldCheck,
  CalendarClock,
  Info,
} from 'lucide-react';

import StatCard from '../components/common/StatCard.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import '../components/common/common.css';

import { getDashboardOverview, getDashboardAttention, DASHBOARD_PERIODS } from '../services/dashboardService.js';
import { useAuth } from '../hooks/useAuth.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { RISK_CATEGORY_LABELS } from '../constants/students.js';
import { CONCERN_CATEGORY_LABELS } from '../constants/interventions.js';
import { formatClass, formatDate, formatPercent, attendanceTone } from '../utils/formatters.js';

const PERIOD_KEY = 'udaan.dashboardPeriod';

function readPeriod() {
  try {
    const stored = Number(window.localStorage.getItem(PERIOD_KEY));
    return DASHBOARD_PERIODS.some((p) => p.days === stored) ? stored : 30;
  } catch {
    return 30;
  }
}

const RISK_SEGMENTS = [
  { key: 'HIGH', color: 'var(--color-risk-high)' },
  { key: 'MEDIUM', color: 'var(--color-risk-medium)' },
  { key: 'LOW', color: 'var(--color-risk-low)' },
  { key: 'INSUFFICIENT_DATA', color: '#cbd5e1' },
];

export default function Dashboard() {
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const [days, setDays] = useState(readPeriod);
  const [overview, setOverview] = useState(null);
  const [attention, setAttention] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [attentionLoading, setAttentionLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(null);
  const [attentionError, setAttentionError] = useState(null);

  const load = useCallback(async () => {
    setOverviewLoading(true);
    setAttentionLoading(true);
    setOverviewError(null);
    setAttentionError(null);
    const results = await Promise.allSettled([
      getDashboardOverview({ days, role: user?.role }),
      getDashboardAttention(),
    ]);
    const [overviewResult, attentionResult] = results;
    if (overviewResult.status === 'fulfilled') setOverview(overviewResult.value);
    else setOverviewError(overviewResult.reason?.message || 'Could not load dashboard summary.');
    if (attentionResult.status === 'fulfilled') setAttention(attentionResult.value);
    else setAttentionError(attentionResult.reason?.message || 'Could not load attention lists.');
    setOverviewLoading(false);
    setAttentionLoading(false);
  }, [days, user?.role]);

  const retryOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      setOverview(await getDashboardOverview({ days, role: user?.role }));
    } catch (err) {
      setOverviewError(err.message || 'Could not load dashboard summary.');
    } finally {
      setOverviewLoading(false);
    }
  }, [days, user?.role]);

  const retryAttention = useCallback(async () => {
    setAttentionLoading(true);
    setAttentionError(null);
    try {
      setAttention(await getDashboardAttention());
    } catch (err) {
      setAttentionError(err.message || 'Could not load attention lists.');
    } finally {
      setAttentionLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changePeriod = (value) => {
    setDays(value);
    try {
      window.localStorage.setItem(PERIOD_KEY, String(value));
    } catch {
      // preference only
    }
  };

  const isTeacher = overview?.scope === 'ASSIGNED';

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-description">
            {isTeacher
              ? 'Your assigned students: who needs attention, and the follow-ups you are responsible for.'
              : 'Whole-school view: attendance, risk indicators and the follow-ups that need attention.'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select className="filter-select" value={days} onChange={(e) => changePeriod(Number(e.target.value))} aria-label="Attendance period">
            {DASHBOARD_PERIODS.map((p) => <option key={p.days} value={p.days}>{p.label}</option>)}
          </select>
          <Button variant="secondary" size="md" icon={RefreshCw} onClick={load} disabled={overviewLoading || attentionLoading}>
            {overviewLoading || attentionLoading ? 'Refreshing…' : 'Refresh'}
          </Button>
          {can(PERMISSIONS.INTERVENTION_CREATE) && (
            <Link to="/interventions?new=" className="btn btn-primary btn-md">
              <PlusCircle size={16} aria-hidden="true" /> New Intervention
            </Link>
          )}
        </div>
      </div>

      {overviewLoading && !overview && <LoadingState title="Loading Dashboard" message="Loading your summary and follow-ups. This may take a moment." />}
      {!overviewLoading && !overview && overviewError && (
        <ErrorState title="Dashboard Summary Unavailable" message={overviewError} onRetry={retryOverview} />
      )}
      {overviewError && overview && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: '16px' }}>
          <span>Could not refresh the dashboard summary: {overviewError}</span>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={retryOverview} disabled={overviewLoading}>
            Retry summary
          </Button>
        </div>
      )}

      {overview && overview.activeStudents === 0 && (
        <EmptyState
          icon={Users}
          title={isTeacher ? 'No Students Assigned Yet' : 'No Active Students Yet'}
          message={
            isTeacher
              ? 'Ask your school admin to assign students to you. Their attendance and risk will show here.'
              : 'Add students to start recording attendance and marks. The dashboard fills in from those records.'
          }
          actionLabel={!isTeacher && can(PERMISSIONS.STUDENT_CREATE) ? 'Go to Students' : undefined}
          onAction={() => navigate('/students')}
        />
      )}

      {overview && overview.activeStudents > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', opacity: overviewLoading ? 0.6 : 1, transition: 'opacity 0.2s' }} aria-busy={overviewLoading}>
          {/* Headline figures */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
            <StatCard
              title={isTeacher ? 'Assigned Students' : 'Active Students'}
              value={overview.activeStudents}
              icon={Users}
              subtitle={isTeacher ? 'currently enrolled' : 'enrolled and attending'}
              to="/students"
            />
            <StatCard
              title="Attendance Rate"
              value={formatPercent(overview.attendance.rate)}
              icon={CalendarCheck}
              iconColor={attendanceTone(overview.attendance.rate)}
              iconBg="var(--color-bg-muted)"
              subtitle={`${overview.attendance.studentsBelow75} student${overview.attendance.studentsBelow75 === 1 ? '' : 's'} below 75%`}
              to="/attendance"
            />
            <StatCard
              title="High Risk"
              value={overview.risk.counts.HIGH}
              icon={AlertTriangle}
              iconColor="var(--color-risk-high)"
              iconBg="var(--color-risk-high-subtle)"
              subtitle={`${overview.risk.counts.MEDIUM} medium · ${overview.risk.awaitingReview} awaiting review`}
              to="/risk?category=HIGH"
            />
            <StatCard
              title="Open Interventions"
              value={overview.interventions.open + overview.interventions.inProgress}
              icon={ClipboardList}
              iconColor="var(--color-primary)"
              iconBg="var(--color-primary-subtle)"
              subtitle={`${overview.interventions.inProgress} in progress · ${overview.interventions.dueThisWeek} due this week`}
              to="/interventions"
            />
            <StatCard
              title="Overdue Follow-ups"
              value={overview.interventions.overdue}
              icon={CalendarClock}
              iconColor={overview.interventions.overdue ? 'var(--color-risk-high)' : 'var(--color-risk-low)'}
              iconBg={overview.interventions.overdue ? 'var(--color-risk-high-subtle)' : 'var(--color-risk-low-subtle)'}
              subtitle="open and past the due date"
              to="/interventions"
            />
          </div>

          <p style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginTop: '-8px' }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
            <span>
              Attendance for {formatDate(overview.period.from)} – {formatDate(overview.period.to)}:{' '}
              {overview.attendance.attended} of {overview.attendance.eligible} eligible student-days attended
              (present or late) across {overview.attendance.recordedDays} recorded school day
              {overview.attendance.recordedDays === 1 ? '' : 's'}. {overview.attendance.excused} excused absence
              {overview.attendance.excused === 1 ? ' is' : 's are'} left out, and days with no record are not counted.
            </span>
          </p>

          {/* Risk distribution */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <ShieldCheck size={18} color="var(--color-primary)" /> Risk Indicators
                </h3>
                <p className="card-subtitle">
                  Current rule-based indicators to help decide who to check in with first — not a prediction.
                </p>
              </div>
              <Link to="/risk" className="btn btn-secondary btn-sm">View Risk Details</Link>
            </div>
            <div className="card-body">
              <RiskDistribution counts={overview.risk.counts} total={overview.activeStudents} />
              {overview.risk.provisional > 0 && (
                <p className="form-helper" style={{ marginTop: '10px' }}>
                  {overview.risk.provisional} score{overview.risk.provisional === 1 ? ' is' : 's are'} provisional (not enough
                  attendance days or no marks yet).
                </p>
              )}
            </div>
          </div>

          <div className="grid-2">
            <AttentionList students={attention?.students ?? []} canCreate={can(PERMISSIONS.INTERVENTION_CREATE)} loading={attentionLoading} error={attentionError} onRetry={retryAttention} />
            <FollowUpList followUps={attention?.followUps ?? []} userId={user?.id} loading={attentionLoading} error={attentionError} onRetry={retryAttention} />
          </div>
        </div>
      )}
      {!overview && attention && (
        <div className="grid-2" style={{ marginTop: '24px' }}>
          <AttentionList students={attention.students ?? []} canCreate={can(PERMISSIONS.INTERVENTION_CREATE)} loading={attentionLoading} error={attentionError} onRetry={retryAttention} />
          <FollowUpList followUps={attention.followUps ?? []} userId={user?.id} loading={attentionLoading} error={attentionError} onRetry={retryAttention} />
        </div>
      )}
    </div>
  );
}

function RiskDistribution({ counts, total }) {
  return (
    <>
      <div
        style={{ height: '14px', borderRadius: 'var(--radius-full)', overflow: 'hidden', display: 'flex', backgroundColor: 'var(--color-bg-muted)', marginBottom: '16px' }}
        role="img"
        aria-label={RISK_SEGMENTS.map((s) => `${RISK_CATEGORY_LABELS[s.key]}: ${counts[s.key]}`).join(', ')}
      >
        {RISK_SEGMENTS.map((s) =>
          counts[s.key] ? (
            <div key={s.key} title={`${RISK_CATEGORY_LABELS[s.key]}: ${counts[s.key]}`}
              style={{ width: `${(counts[s.key] / total) * 100}%`, backgroundColor: s.color, transition: 'width 0.4s ease' }} />
          ) : null
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {RISK_SEGMENTS.map((s) => (
          <Link
            key={s.key}
            to={`/risk?category=${s.key}`}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-muted)', textDecoration: 'none', color: 'inherit' }}
          >
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '13px', flex: 1 }}>{RISK_CATEGORY_LABELS[s.key]}</span>
            <strong style={{ fontSize: '16px' }}>{counts[s.key]}</strong>
          </Link>
        ))}
      </div>
    </>
  );
}

function AttentionList({ students, canCreate, loading, error, onRetry }) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title"><AlertTriangle size={18} color="var(--color-risk-high)" /> Students Needing Attention</h3>
          <p className="card-subtitle">High and medium indicators, with the main reason</p>
        </div>
      </div>
      {loading && students.length === 0 ? (
        <LoadingState title="Loading Risk Alerts" message="Getting students who may need a check-in." />
      ) : error && students.length === 0 ? (
        <ErrorState title="Risk Alerts Unavailable" message={error} onRetry={onRetry} />
      ) : students.length === 0 ? (
        <div className="card-body" style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          No students have a medium or high indicator right now.
        </div>
      ) : (
        <>
        {error && <p className="form-helper" role="status" style={{ padding: '10px 20px 0' }}>Could not refresh risk alerts. Showing the last loaded results.</p>}
        {loading && <p className="form-helper" role="status" style={{ padding: '10px 20px 0' }}>Refreshing risk alerts…</p>}
        <ul style={{ listStyle: 'none' }}>
          {students.map((s) => (
            <li key={s.student.id} style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', gap: '12px', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <Link to={`/students/${s.student.id}`} style={{ fontWeight: 600, color: 'var(--color-primary-dark)', textDecoration: 'none' }}>
                    {s.student.fullName}
                  </Link>
                  <Badge type="risk" value={s.category} />
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{s.score}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {formatClass(s.student.grade, s.student.section)} · {s.topReason || 'No reason recorded'}
                </div>
                <div style={{ fontSize: '11px', marginTop: '4px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ color: s.needsReview ? '#b45309' : 'var(--color-text-secondary)', fontWeight: s.needsReview ? 600 : 400 }}>
                    {s.needsReview ? 'Awaiting review' : 'Reviewed'}
                  </span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {s.openInterventions ? `${s.openInterventions} open intervention${s.openInterventions === 1 ? '' : 's'}` : 'No open intervention'}
                  </span>
                </div>
              </div>
              {canCreate && s.openInterventions === 0 && (
                <Link to={`/interventions?new=${s.student.id}`} className="btn btn-outline btn-sm">
                  <PlusCircle size={14} aria-hidden="true" /> Intervention
                </Link>
              )}
            </li>
          ))}
        </ul>
        </>
      )}
    </div>
  );
}

function FollowUpList({ followUps, userId, loading, error, onRetry }) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title"><CalendarClock size={18} color="var(--color-primary)" /> Follow-ups</h3>
          <p className="card-subtitle">Open interventions overdue or due in the next 7 days</p>
        </div>
        <Link to="/interventions" className="btn btn-secondary btn-sm">All Interventions</Link>
      </div>
      {loading && followUps.length === 0 ? (
        <LoadingState title="Loading Follow-ups" message="Checking for overdue and upcoming interventions." />
      ) : error && followUps.length === 0 ? (
        <ErrorState title="Follow-ups Unavailable" message={error} onRetry={onRetry} />
      ) : followUps.length === 0 ? (
        <div className="card-body" style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Nothing overdue or due this week.
        </div>
      ) : (
        <>
        {error && <p className="form-helper" role="status" style={{ padding: '10px 20px 0' }}>Could not refresh follow-ups. Showing the last loaded results.</p>}
        {loading && <p className="form-helper" role="status" style={{ padding: '10px 20px 0' }}>Refreshing follow-ups…</p>}
        <ul style={{ listStyle: 'none' }}>
          {followUps.map((f) => (
            <li key={f.id} style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
              <Link
                to={`/interventions?id=${f.id}`}
                style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', textDecoration: 'none', color: 'inherit', boxShadow: f.isOverdue ? 'inset 3px 0 0 var(--color-risk-high)' : undefined }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{f.student.fullName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {CONCERN_CATEGORY_LABELS[f.category]} · {f.assignedToId === userId ? 'You' : f.assignedToName}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {f.isOverdue ? (
                    <Badge type="overdue">{f.daysOverdue}d overdue</Badge>
                  ) : (
                    <span style={{ fontWeight: 600 }}>Due {formatDate(f.dueDate)}</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
        </>
      )}
    </div>
  );
}
