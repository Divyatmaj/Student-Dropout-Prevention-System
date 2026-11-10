import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ClipboardList, PlusCircle, RotateCcw, AlertTriangle, CalendarClock, CheckCircle2, UserCheck } from 'lucide-react';
import { CONCERN_CATEGORIES, INTERVENTION_PRIORITIES, INTERVENTION_STATUSES } from '@udaan/shared';

import StatCard from '../components/common/StatCard.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import SearchBar from '../components/common/SearchBar.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import InterventionFormModal from '../components/interventions/InterventionFormModal.jsx';
import InterventionDetailModal from '../components/interventions/InterventionDetailModal.jsx';
import '../components/common/common.css';

import { getInterventionsOverview, getInterventions } from '../services/interventionService.js';
import { useAuth } from '../hooks/useAuth.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { formatClass, formatDate } from '../utils/formatters.js';
import {
  CONCERN_CATEGORY_LABELS,
  INTERVENTION_PRIORITY_LABELS,
  INTERVENTION_STATUS_LABELS,
} from '../constants/interventions.js';

const DEFAULT_FILTERS = { status: 'active', priority: '', category: '', assignedTo: '', due: '', dueFrom: '', dueTo: '' };

export default function Interventions() {
  const { can } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [overview, setOverview] = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');

  // Modals: create (with optional student), detail, edit.
  const [creating, setCreating] = useState(null); // null | { studentId }
  const [viewingId, setViewingId] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, list] = await Promise.all([getInterventionsOverview(), getInterventions({ ...filters, search })]);
      setOverview(ov);
      setInterventions(list.interventions || []);
    } catch (err) {
      setError(err.message || 'Could not load interventions.');
    } finally {
      setLoading(false);
    }
  }, [filters, search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  // Deep links: ?new=<studentId> opens the create form, ?id=<id> opens a case.
  useEffect(() => {
    const newFor = searchParams.get('new');
    const id = searchParams.get('id');
    if (newFor === null && !id) return;
    if (newFor !== null && can(PERMISSIONS.INTERVENTION_CREATE)) setCreating({ studentId: newFor });
    if (id) setViewingId(id);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, can]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const quickFilter = (next) => setFilters({ ...DEFAULT_FILTERS, ...next });
  const reset = () => {
    setSearch('');
    setFilters(DEFAULT_FILTERS);
  };
  const isFiltered = search || Object.entries(filters).some(([k, v]) => v !== DEFAULT_FILTERS[k]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Interventions</h2>
          <p className="page-description">
            Support actions with an owner and a due date. Track what was done and how it turned out.
          </p>
        </div>
        {can(PERMISSIONS.INTERVENTION_CREATE) && (
          <Button variant="primary" size="md" icon={PlusCircle} onClick={() => setCreating({ studentId: '' })}>
            New Intervention
          </Button>
        )}
      </div>

      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <button type="button" style={cardButtonStyle} onClick={() => quickFilter({ status: 'active' })} aria-label="Show open interventions">
            <StatCard title="Open" value={overview.open} icon={ClipboardList} iconColor="var(--color-primary)" iconBg="var(--color-primary-subtle)"
              subtitle={`${overview.counts.OPEN} not started · ${overview.counts.IN_PROGRESS} in progress`} />
          </button>
          <button type="button" style={cardButtonStyle} onClick={() => quickFilter({ due: 'overdue' })} aria-label="Show overdue interventions">
            <StatCard title="Overdue" value={overview.overdue} icon={AlertTriangle} iconColor="var(--color-risk-high)" iconBg="var(--color-risk-high-subtle)"
              subtitle="open and past the due date" />
          </button>
          <button type="button" style={cardButtonStyle} onClick={() => quickFilter({ due: 'week' })} aria-label="Show interventions due this week">
            <StatCard title="Due This Week" value={overview.dueThisWeek} icon={CalendarClock} iconColor="var(--color-risk-medium)" iconBg="var(--color-risk-medium-subtle)"
              subtitle="next 7 days" />
          </button>
          <button type="button" style={cardButtonStyle} onClick={() => quickFilter({ assignedTo: 'me' })} aria-label="Show interventions assigned to me">
            <StatCard title="Assigned to Me" value={overview.mine} icon={UserCheck} iconColor="#0369a1" iconBg="#e0f2fe" subtitle="open, you are the owner" />
          </button>
          <button type="button" style={cardButtonStyle} onClick={() => quickFilter({ status: 'COMPLETED' })} aria-label="Show completed interventions">
            <StatCard title="Completed" value={overview.counts.COMPLETED} icon={CheckCircle2} iconColor="var(--color-risk-low)" iconBg="var(--color-risk-low-subtle)"
              subtitle={`${overview.counts.CANCELLED} cancelled`} />
          </button>
        </div>
      )}

      <div className="card" style={{ padding: '16px 20px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: 1 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search student, code or owner..." style={{ maxWidth: '260px' }} />
          <select className="filter-select" value={filters.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Filter by status">
            <option value="active">Open &amp; in progress</option>
            <option value="">All statuses</option>
            {INTERVENTION_STATUSES.map((s) => <option key={s} value={s}>{INTERVENTION_STATUS_LABELS[s]}</option>)}
          </select>
          <select className="filter-select" value={filters.category} onChange={(e) => setFilter('category', e.target.value)} aria-label="Filter by concern">
            <option value="">All concerns</option>
            {CONCERN_CATEGORIES.map((c) => <option key={c} value={c}>{CONCERN_CATEGORY_LABELS[c]}</option>)}
          </select>
          <select className="filter-select" value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)} aria-label="Filter by priority">
            <option value="">Any priority</option>
            {INTERVENTION_PRIORITIES.slice().reverse().map((p) => <option key={p} value={p}>{INTERVENTION_PRIORITY_LABELS[p]}</option>)}
          </select>
          <select className="filter-select" value={filters.assignedTo} onChange={(e) => setFilter('assignedTo', e.target.value)} aria-label="Filter by owner">
            <option value="">Anyone</option>
            <option value="me">Assigned to me</option>
          </select>
          <select className="filter-select" value={filters.due} onChange={(e) => setFilter('due', e.target.value)} aria-label="Filter by due date">
            <option value="">Any due date</option>
            <option value="overdue">Overdue</option>
            <option value="week">Due in the next 7 days</option>
          </select>
          <label style={{ display: 'grid', gap: '4px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            Due from
            <input type="date" className="filter-select" value={filters.dueFrom}
              max={filters.dueTo || undefined} onChange={(e) => setFilter('dueFrom', e.target.value)}
              aria-label="Filter interventions due on or after" />
          </label>
          <label style={{ display: 'grid', gap: '4px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            Due to
            <input type="date" className="filter-select" value={filters.dueTo}
              min={filters.dueFrom || undefined} onChange={(e) => setFilter('dueTo', e.target.value)}
              aria-label="Filter interventions due on or before" />
          </label>
          {isFiltered && <Button variant="secondary" size="sm" icon={RotateCcw} onClick={reset}>Reset</Button>}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          {interventions.length} intervention{interventions.length === 1 ? '' : 's'}
        </div>
      </div>

      {notice && (
        <div className="alert alert-success" role="status" style={{ marginBottom: '16px' }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{notice}</span>
        </div>
      )}

      {loading && interventions.length === 0 && <LoadingState message="Loading interventions..." />}
      {!loading && error && <ErrorState title="Unable to Load Interventions" message={error} onRetry={load} />}
      {!loading && !error && interventions.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title={isFiltered ? 'No Interventions Match' : 'No Open Interventions'}
          message={
            isFiltered
              ? 'Nothing matches these filters.'
              : 'When a student needs support, create an intervention with an owner and a due date.'
          }
          actionLabel={isFiltered ? 'Reset Filters' : can(PERMISSIONS.INTERVENTION_CREATE) ? 'New Intervention' : undefined}
          onAction={isFiltered ? reset : () => setCreating({ studentId: '' })}
        />
      )}

      {!error && interventions.length > 0 && (
        <div className="card" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Concern</th>
                  <th>Owner</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {interventions.map((i) => (
                  <tr key={i.id} className={i.isOverdue ? 'row-overdue' : undefined}>
                    <td>
                      {i.student ? (
                        <Link to={`/students/${i.studentId}`} style={{ fontWeight: 600, color: 'var(--color-primary-dark)', textDecoration: 'none' }}>
                          {i.student.fullName}
                        </Link>
                      ) : (
                        <span style={{ fontWeight: 600 }}>{i.studentId}</span>
                      )}
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        {i.student && `${i.student.studentCode} · ${formatClass(i.student.grade, i.student.section)}`}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{CONCERN_CATEGORY_LABELS[i.category]}</div>
                      <Badge type="priority" value={i.priority} />
                    </td>
                    <td style={{ fontSize: '13px' }}>{i.assignedToName || 'Unassigned'}</td>
                    <td style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {i.isOpen ? (
                        <>
                          <div style={{ fontWeight: i.isOverdue ? 700 : 500, color: i.isOverdue ? 'var(--color-risk-high)' : 'inherit' }}>
                            {formatDate(i.dueDate)}
                          </div>
                          {i.isOverdue && (
                            <div style={{ fontSize: '11px', color: 'var(--color-risk-high)' }}>
                              {i.daysOverdue} day{i.daysOverdue === 1 ? '' : 's'} overdue
                            </div>
                          )}
                          {!i.isOverdue && i.followUpDate && (
                            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>follow-up {formatDate(i.followUpDate)}</div>
                          )}
                        </>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)' }}>Closed {formatDate(i.updatedAt)}</span>
                      )}
                    </td>
                    <td><Badge type="status" value={i.status} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <Button variant="outline" size="sm" onClick={() => setViewingId(i.id)}>
                        {i.isOpen ? 'Open' : 'View'}
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
        <InterventionFormModal
          initialStudentId={creating.studentId}
          onClose={() => setCreating(null)}
          onSaved={(saved) => {
            setCreating(null);
            setNotice(`Created an intervention for ${saved.student?.fullName ?? 'the student'}, owned by ${saved.assignedToName}.`);
            load();
          }}
        />
      )}

      {viewingId && !editing && (
        <InterventionDetailModal
          interventionId={viewingId}
          onClose={() => setViewingId(null)}
          onEdit={(item) => setEditing(item)}
          onChanged={(updated, message) => {
            setNotice(`${updated.student?.fullName ?? updated.id}: ${message}`);
            load();
          }}
        />
      )}

      {editing && (
        <InterventionFormModal
          intervention={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setEditing(null);
            setNotice(`Saved changes to ${saved.student?.fullName ?? saved.id}'s intervention.`);
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
