import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  FilePlus2,
  TrendingDown,
  ClipboardList,
  Percent,
  PenLine,
  Eye,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

import StatCard from '../components/common/StatCard.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import Button from '../components/common/Button.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import AssessmentFormModal from '../components/academics/AssessmentFormModal.jsx';
import MarksSheetModal from '../components/academics/MarksSheetModal.jsx';
import '../components/common/common.css';

import { getAcademicOverview, getAssessments } from '../services/academicService.js';
import { useAuth } from '../hooks/useAuth.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { GRADES, SECTIONS } from '../constants/students.js';
import { SUBJECTS } from '../constants/academics.js';
import { formatClass, formatDate, formatPercent } from '../utils/formatters.js';

const DEFAULT_FILTERS = { grade: '', section: '', subject: '' };

function percentTone(value) {
  if (value === null || value === undefined) return 'var(--color-text-muted)';
  if (value < 40) return 'var(--color-risk-high)';
  if (value < 60) return 'var(--color-risk-medium)';
  return 'var(--color-risk-low)';
}

export default function Academics() {
  const { can } = useAuth();
  const [overview, setOverview] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const [creating, setCreating] = useState(false);
  const [sheetId, setSheetId] = useState(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, list] = await Promise.all([getAcademicOverview(), getAssessments({ ...filters, search })]);
      setOverview(ov);
      setAssessments(list.assessments || []);
    } catch (err) {
      setError(err.message || 'Could not load assessments.');
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Academics</h2>
          <p className="page-description">
            Create assessments, enter marks for a class and see which students' results have dropped in a
            subject.
          </p>
        </div>
        {can(PERMISSIONS.ASSESSMENT_CREATE) && (
          <Button variant="primary" size="md" icon={FilePlus2} onClick={() => setCreating(true)}>
            New Assessment
          </Button>
        )}
      </div>

      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <StatCard title="Average Result" value={formatPercent(overview.averagePercentage)} icon={Percent} subtitle={`${overview.marksCount} marks recorded`} />
          <StatCard title="Assessments" value={overview.assessmentsCount} icon={ClipboardList} iconColor="#0369a1" iconBg="#e0f2fe" subtitle="across all classes" />
          <StatCard
            title="Marks Still to Enter"
            value={overview.pendingAssessments}
            icon={PenLine}
            iconColor="var(--color-risk-medium)"
            iconBg="var(--color-risk-medium-subtle)"
            subtitle="assessments with missing marks"
          />
          <StatCard
            title="Declining Results"
            value={overview.declining.length}
            icon={TrendingDown}
            iconColor="var(--color-risk-high)"
            iconBg="var(--color-risk-high-subtle)"
            badgeType="high"
            badgeText="10+ point drop"
            subtitle="same subject"
          />
        </div>
      )}

      {notice && (
        <div className="alert alert-success" role="status" style={{ marginBottom: '16px' }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{notice}</span>
        </div>
      )}

      {/* Declining results */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <TrendingDown size={18} color="var(--color-risk-high)" />
                Students Whose Results Dropped
              </h3>
              <p className="card-subtitle">
                Latest result vs. the previous one in the same subject. A drop of 10+ points adds +10 to the
                risk score; 20+ adds +20.
              </p>
            </div>
          </div>
          <div className="card-body">
            {!overview ? null : overview.declining.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '12px' }}>
                No student has a same-subject drop of 10 points or more.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Subject</th>
                      <th>Previous</th>
                      <th>Latest</th>
                      <th>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.declining.map((d) => (
                      <tr key={`${d.studentId}-${d.subject}`}>
                        <td>
                          <Link to={`/students/${d.studentId}`} style={{ fontWeight: 600, color: 'var(--color-primary-dark)', textDecoration: 'none' }}>
                            {d.studentName}
                          </Link>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            {d.studentCode} · {formatClass(d.grade, d.section)}
                          </div>
                        </td>
                        <td>{d.subject}</td>
                        <td>{formatPercent(d.previous)}</td>
                        <td style={{ fontWeight: 600, color: percentTone(d.latest) }}>{formatPercent(d.latest)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--color-risk-high)' }}>−{d.drop} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      {/* Assessments */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: 1 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by title or subject..." style={{ maxWidth: '260px' }} />
          <select className="filter-select" value={filters.subject} onChange={(e) => setFilter('subject', e.target.value)} aria-label="Filter by subject">
            <option value="">All subjects</option>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
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
          {assessments.length} assessment{assessments.length === 1 ? '' : 's'}
        </div>
      </div>

      {loading && assessments.length === 0 && <LoadingState message="Loading assessments..." />}
      {!loading && error && <ErrorState title="Unable to Load Assessments" message={error} onRetry={load} />}
      {!loading && !error && assessments.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title={isFiltered ? 'No Assessments Match' : 'No Assessments Yet'}
          message={isFiltered ? 'Try clearing the filters.' : 'Create an assessment to start recording marks.'}
          actionLabel={isFiltered ? 'Reset Filters' : can(PERMISSIONS.ASSESSMENT_CREATE) ? 'New Assessment' : undefined}
          onAction={isFiltered ? reset : () => setCreating(true)}
        />
      )}

      {!error && assessments.length > 0 && (
        <div className="card" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Assessment</th>
                  <th>Class</th>
                  <th>Date</th>
                  <th>Marks entered</th>
                  <th>Class average</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.subject}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        {a.title} · out of {a.maxMarks}
                      </div>
                    </td>
                    <td style={{ fontSize: '12px' }}>{formatClass(a.grade, a.section)}</td>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDate(a.assessmentDate)}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{a.marksCount}</span>
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}> / {a.classSize}</span>
                      {a.missingMarks > 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--color-risk-medium)', fontWeight: 600 }}>
                          {a.missingMarks} missing
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600, color: percentTone(a.averagePercentage) }}>{formatPercent(a.averagePercentage)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        variant={a.missingMarks > 0 && can(PERMISSIONS.MARKS_RECORD) ? 'primary' : 'secondary'}
                        size="sm"
                        icon={can(PERMISSIONS.MARKS_RECORD) ? PenLine : Eye}
                        onClick={() => setSheetId(a.id)}
                        aria-label={`${can(PERMISSIONS.MARKS_RECORD) ? 'Enter marks for' : 'View marks for'} ${a.subject} ${a.title}, ${formatClass(a.grade, a.section)}`}
                      >
                        {can(PERMISSIONS.MARKS_RECORD) ? 'Marks' : 'View'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {creating && (
        <AssessmentFormModal
          onClose={() => setCreating(false)}
          onCreated={(created) => {
            setCreating(false);
            setNotice(`Created ${created.subject} · ${created.title} for ${formatClass(created.grade, created.section)}.`);
            load();
            setSheetId(created.id);
          }}
        />
      )}

      {sheetId && (
        <MarksSheetModal
          assessmentId={sheetId}
          onClose={() => setSheetId(null)}
          onSaved={(result, assessment) => {
            setSheetId(null);
            const parts = [];
            if (result.created) parts.push(`${result.created} new`);
            if (result.updated) parts.push(`${result.updated} corrected`);
            setNotice(`Saved marks for ${assessment.subject} · ${assessment.title} (${parts.join(', ')}). Risk indicators updated.`);
            load();
          }}
        />
      )}
    </div>
  );
}
