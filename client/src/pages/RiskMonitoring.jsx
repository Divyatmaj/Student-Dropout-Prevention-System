import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  PlusCircle,
  BookOpen,
} from 'lucide-react';
import { RISK_RULES, RISK_CATEGORY_BANDS, MIN_ELIGIBLE_SCHOOL_DAYS } from '@udaan/shared';

import StatCard from '../components/common/StatCard.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import RiskExplanation, { RiskScoreBar, ReviewStatus } from '../components/risk/RiskExplanation.jsx';
import ReviewRiskModal from '../components/risk/ReviewRiskModal.jsx';
import '../components/common/common.css';

import {
  getRiskOverview,
  getRiskList,
  recalculateStudentRisk,
  recalculateAllRisk,
} from '../services/riskService.js';
import { useAuth } from '../hooks/useAuth.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { GRADES, SECTIONS, RISK_CATEGORY, RISK_CATEGORY_LABELS } from '../constants/students.js';
import { DATA_STATUS_LABELS, RISK_REVIEW_FILTERS } from '../constants/risk.js';
import { formatClass, formatDate } from '../utils/formatters.js';

const DEFAULT_FILTERS = { category: '', dataStatus: '', grade: '', section: '', review: '' };

export default function RiskMonitoring() {
  const { can } = useAuth();
  const [overview, setOverview] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [expanded, setExpanded] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [recalculating, setRecalculating] = useState(null); // studentId | 'all' | null
  const [notice, setNotice] = useState('');
  const [rulesOpen, setRulesOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, list] = await Promise.all([getRiskOverview(), getRiskList({ ...filters, search })]);
      setOverview(ov);
      setAssessments(list.assessments || []);
    } catch (err) {
      setError(err.message || 'Could not load risk indicators.');
    } finally {
      setLoading(false);
    }
  }, [filters, search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const reset = () => {
    setSearch('');
    setFilters(DEFAULT_FILTERS);
  };
  const isFiltered = search || Object.values(filters).some(Boolean);

  const handleRecalculate = async (studentId, name) => {
    setRecalculating(studentId);
    try {
      const { assessment, previous } = await recalculateStudentRisk(studentId);
      const changed = !previous || previous.score !== assessment.score || previous.category !== assessment.category;
      setNotice(
        changed
          ? `${name}: ${previous ? `${previous.score} → ` : ''}${assessment.score} (${RISK_CATEGORY_LABELS[assessment.category]}).`
          : `${name}: no change (${assessment.score}, ${RISK_CATEGORY_LABELS[assessment.category]}).`
      );
      await load();
    } catch (err) {
      setNotice(err.message || 'Recalculation failed.');
    } finally {
      setRecalculating(null);
    }
  };

  const handleRecalculateAll = async () => {
    setRecalculating('all');
    try {
      const { processed, changed } = await recalculateAllRisk();
      setNotice(`Recalculated ${processed} active students — ${changed} changed.`);
      await load();
    } catch (err) {
      setNotice(err.message || 'Recalculation failed.');
    } finally {
      setRecalculating(null);
    }
  };

  const filterByCategory = (category) => setFilters({ ...DEFAULT_FILTERS, category });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Risk Monitoring</h2>
          <p className="page-description">
            Transparent, rule-based indicators that help staff decide who to check in with first. Every
            flag shows exactly why it was raised.
          </p>
        </div>
        {can(PERMISSIONS.RISK_RECALCULATE_ALL) && (
          <Button variant="secondary" size="md" icon={RefreshCw} onClick={handleRecalculateAll} disabled={recalculating !== null}>
            {recalculating === 'all' ? 'Recalculating...' : 'Recalculate All'}
          </Button>
        )}
      </div>

      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <button type="button" onClick={() => filterByCategory('HIGH')} style={cardButtonStyle} aria-label="Show high risk students">
            <StatCard title="High" value={overview.counts.HIGH} icon={AlertTriangle} iconColor="var(--color-risk-high)" iconBg="var(--color-risk-high-subtle)" subtitle={`Score ${RISK_CATEGORY_BANDS.high}+ · prompt review`} />
          </button>
          <button type="button" onClick={() => filterByCategory('MEDIUM')} style={cardButtonStyle} aria-label="Show medium risk students">
            <StatCard title="Medium" value={overview.counts.MEDIUM} icon={Clock} iconColor="var(--color-risk-medium)" iconBg="var(--color-risk-medium-subtle)" subtitle={`Score ${RISK_CATEGORY_BANDS.medium}–${RISK_CATEGORY_BANDS.high - 1} · monitor`} />
          </button>
          <button type="button" onClick={() => filterByCategory('LOW')} style={cardButtonStyle} aria-label="Show low risk students">
            <StatCard title="Low" value={overview.counts.LOW} icon={CheckCircle2} iconColor="var(--color-risk-low)" iconBg="var(--color-risk-low-subtle)" subtitle={`Score 0–${RISK_CATEGORY_BANDS.medium - 1}`} />
          </button>
          <button type="button" onClick={() => setFilters({ ...DEFAULT_FILTERS, dataStatus: 'PROVISIONAL' })} style={cardButtonStyle} aria-label="Show students with incomplete data">
            <StatCard title="Incomplete Data" value={overview.provisional + overview.counts.INSUFFICIENT_DATA} icon={HelpCircle} iconColor="#92400e" iconBg="var(--color-accent-subtle)" subtitle={`${overview.provisional} provisional · ${overview.counts.INSUFFICIENT_DATA} no score`} />
          </button>
          <button type="button" onClick={() => setFilters({ ...DEFAULT_FILTERS, review: 'needs' })} style={cardButtonStyle} aria-label="Show flags awaiting review">
            <StatCard title="Awaiting Review" value={overview.awaitingReview} icon={ClipboardCheck} iconColor="#0369a1" iconBg="#e0f2fe" subtitle="medium & high flags" />
          </button>
        </div>
      )}

      {/* Rules explainer */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setRulesOpen((o) => !o)}
          aria-expanded={rulesOpen}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>
            <BookOpen size={17} color="var(--color-primary)" /> How the score works
          </span>
          {rulesOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {rulesOpen && (
          <div className="card-body" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
            <div className="grid-2">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr><th>Rule</th><th style={{ textAlign: 'right' }}>Points</th></tr>
                  </thead>
                  <tbody>
                    {RISK_RULES.map((rule) => (
                      <tr key={rule.code}>
                        <td style={{ fontSize: '12px' }}>{rule.description}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>+{rule.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6, paddingLeft: '18px' }}>
                <li>Only one band per indicator counts (e.g. attendance gives +30 <em>or</em> +15). The total is capped at 100.</li>
                <li><strong>Low</strong> 0–24, <strong>Medium</strong> 25–49, <strong>High</strong> 50+.</li>
                <li>Academic decline compares the latest two results in the <em>same subject</em>, as percentages.</li>
                <li>Fewer than {MIN_ELIGIBLE_SCHOOL_DAYS} school days or no marks → the score is <strong>provisional</strong>. No usable data → <strong>insufficient data</strong>, never “low”.</li>
                <li>Scores update automatically when attendance, marks or support flags change.</li>
                <li>This is a prototype heuristic to prioritise human review. It is not validated, not a prediction, and must never be used to punish or exclude a student. Caste, religion, gender and disability are never used.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: 1 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name or student code..." style={{ maxWidth: '280px' }} />
          <select className="filter-select" value={filters.category} onChange={(e) => setFilter('category', e.target.value)} aria-label="Filter by risk category">
            <option value="">All categories</option>
            {Object.values(RISK_CATEGORY).map((c) => <option key={c} value={c}>{RISK_CATEGORY_LABELS[c]}</option>)}
          </select>
          <select className="filter-select" value={filters.dataStatus} onChange={(e) => setFilter('dataStatus', e.target.value)} aria-label="Filter by data completeness">
            <option value="">Any data status</option>
            {Object.entries(DATA_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className="filter-select" value={filters.review} onChange={(e) => setFilter('review', e.target.value)} aria-label="Filter by review status">
            <option value="">Any review status</option>
            {RISK_REVIEW_FILTERS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <select className="filter-select" value={filters.grade} onChange={(e) => setFilter('grade', e.target.value)} aria-label="Filter by grade">
            <option value="">All grades</option>
            {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
          </select>
          <select className="filter-select" value={filters.section} onChange={(e) => setFilter('section', e.target.value)} aria-label="Filter by section">
            <option value="">All sections</option>
            {SECTIONS.map((s) => <option key={s} value={s}>Section {s}</option>)}
          </select>
          {isFiltered && <Button variant="secondary" size="sm" icon={RotateCcw} onClick={reset}>Reset</Button>}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          {assessments.length} student{assessments.length === 1 ? '' : 's'}
        </div>
      </div>

      {notice && (
        <div className="alert alert-success" role="status" style={{ marginBottom: '16px' }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{notice}</span>
        </div>
      )}

      {loading && assessments.length === 0 && <LoadingState message="Loading risk indicators..." />}
      {!loading && error && <ErrorState title="Unable to Load Risk Indicators" message={error} onRetry={load} />}
      {!loading && !error && assessments.length === 0 && (
        <EmptyState
          icon={ShieldAlert}
          title="No Students Match"
          message={isFiltered ? 'No students match these filters.' : 'There are no active students to assess yet.'}
          actionLabel={isFiltered ? 'Reset Filters' : undefined}
          onAction={isFiltered ? reset : undefined}
        />
      )}

      {!error && assessments.length > 0 && (
        <div className="card" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Indicator</th>
                  <th>Main reasons</th>
                  <th>Review</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => {
                  const isOpen = expanded === a.studentId;
                  return (
                    <React.Fragment key={a.studentId}>
                      <tr>
                        <td>
                          <Link to={`/students/${a.studentId}`} style={{ fontWeight: 600, color: 'var(--color-primary-dark)', textDecoration: 'none' }}>
                            {a.student.fullName}
                          </Link>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            {a.student.studentCode} · {formatClass(a.student.grade, a.student.section)}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                            <Badge type="risk" value={a.category} />
                            <RiskScoreBar score={a.score} category={a.category} />
                            {a.dataStatus === 'PROVISIONAL' && <Badge type="dataStatus" value={a.dataStatus} />}
                          </div>
                        </td>
                        <td style={{ maxWidth: '300px' }}>
                          {a.reasons.length === 0 ? (
                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              {a.category === 'INSUFFICIENT_DATA' ? 'Not enough data yet' : 'No rules triggered'}
                            </span>
                          ) : (
                            <ul style={{ listStyle: 'none', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {a.reasons.slice(0, 2).map((r) => (
                                <li key={r.code}>
                                  <strong>+{r.points}</strong> {r.label}
                                </li>
                              ))}
                              {a.reasons.length > 2 && (
                                <li style={{ color: 'var(--color-text-secondary)' }}>+{a.reasons.length - 2} more</li>
                              )}
                            </ul>
                          )}
                          <button
                            type="button"
                            onClick={() => setExpanded(isOpen ? null : a.studentId)}
                            aria-expanded={isOpen}
                            style={{ marginTop: '4px', background: 'none', border: 'none', padding: 0, color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            {isOpen ? 'Hide details' : 'Why?'}
                          </button>
                        </td>
                        <td>
                          <ReviewStatus assessment={a} compact />
                          {a.category === 'LOW' && <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Not needed</span>}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {can(PERMISSIONS.RISK_REVIEW) && a.needsReview && (
                              <Button variant="primary" size="sm" icon={ClipboardCheck} onClick={() => setReviewing(a)}>
                                Review
                              </Button>
                            )}
                            {can(PERMISSIONS.INTERVENTION_CREATE) && (a.category === 'HIGH' || a.category === 'MEDIUM') && (
                              <Link
                                to={`/interventions?studentId=${a.studentId}&name=${encodeURIComponent(a.student.fullName)}`}
                                className="btn btn-outline btn-sm"
                              >
                                <PlusCircle size={14} aria-hidden="true" /> Intervention
                              </Link>
                            )}
                            {can(PERMISSIONS.RISK_RECALCULATE) && (
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={RefreshCw}
                                onClick={() => handleRecalculate(a.studentId, a.student.fullName)}
                                disabled={recalculating !== null}
                                aria-label={`Recalculate risk for ${a.student.fullName}`}
                              >
                                {recalculating === a.studentId ? '...' : ''}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={5} style={{ backgroundColor: '#fcfcfa' }}>
                            <div style={{ maxWidth: '640px', padding: '4px 0' }}>
                              <RiskExplanation assessment={a} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {overview?.lastCalculatedAt && (
            <div style={{ padding: '10px 20px', fontSize: '11px', color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border-subtle)' }}>
              Last calculated {formatDate(overview.lastCalculatedAt)}
            </div>
          )}
        </div>
      )}

      {reviewing && (
        <ReviewRiskModal
          assessment={reviewing}
          studentName={reviewing.student.fullName}
          onClose={() => setReviewing(null)}
          onReviewed={() => {
            setNotice(`Marked ${reviewing.student.fullName}'s flag as reviewed.`);
            setReviewing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

const cardButtonStyle = {
  padding: 0,
  border: 'none',
  background: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  font: 'inherit',
  color: 'inherit',
  display: 'block',
  width: '100%',
};
