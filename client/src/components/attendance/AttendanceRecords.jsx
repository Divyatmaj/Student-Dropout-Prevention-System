import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, RotateCcw, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { ATTENDANCE_STATUSES, ATTENDANCE_STATUS_LABELS } from '@udaan/shared';

import SearchBar from '../common/SearchBar.jsx';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';
import Modal from '../common/Modal.jsx';
import LoadingState from '../common/LoadingState.jsx';
import ErrorState from '../common/ErrorState.jsx';
import EmptyState from '../common/EmptyState.jsx';
import {
  getAttendanceRecords,
  updateAttendance,
  deleteAttendance,
  ATTENDANCE_PAGE_SIZE,
} from '../../services/attendanceService.js';
import { useAuth } from '../../hooks/useAuth.js';
import { PERMISSIONS, canCorrectAttendance } from '../../utils/permissions.js';
import { GRADES, SECTIONS } from '../../constants/students.js';
import { formatDate, formatClass, todayISO } from '../../utils/formatters.js';

const DEFAULT_FILTERS = { date: '', grade: '', section: '', status: '' };
const EXPORT_PAGE_SIZE = 500;

function csvCell(value) {
  let text = String(value ?? '');
  // Prevent spreadsheet programs from interpreting user supplied text as a formula.
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadAttendanceCsv(records) {
  const columns = [
    ['Date', (record) => record.date],
    ['Student', (record) => record.studentName],
    ['Student Code', (record) => record.studentCode],
    ['Class', (record) => formatClass(record.grade, record.section)],
    ['Status', (record) => ATTENDANCE_STATUS_LABELS[record.status] || record.status],
    ['Note', (record) => record.note],
    ['Recorded By', (record) => record.recordedByName],
  ];
  const rows = [columns.map(([heading]) => csvCell(heading)).join(','), ...records.map((record) =>
    columns.map(([, value]) => csvCell(value(record))).join(',')
  )];
  const blob = new Blob([`\uFEFF${rows.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `attendance-${todayISO()}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function AttendanceRecords({ initialSearch = '', onChanged }) {
  const { user, can } = useAuth();
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebouncedValue(search);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [notice, setNotice] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAttendanceRecords({ ...filters, search: debouncedSearch, page, limit: ATTENDANCE_PAGE_SIZE });
      setRecords(data.records || []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err.message || 'Could not load attendance records.');
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [filters, debouncedSearch]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const reset = () => {
    setSearch('');
    setFilters(DEFAULT_FILTERS);
  };
  const exportCsv = async () => {
    setExporting(true);
    setExportError('');
    try {
      const exportFilters = { ...filters, search: debouncedSearch, page: 1, limit: EXPORT_PAGE_SIZE };
      const firstPage = await getAttendanceRecords(exportFilters);
      const allRecords = [...(firstPage.records || [])];
      const totalRecords = firstPage.total ?? allRecords.length;
      const pageCount = Math.ceil(totalRecords / EXPORT_PAGE_SIZE);
      for (let nextPage = 2; nextPage <= pageCount; nextPage += 1) {
        const next = await getAttendanceRecords({ ...exportFilters, page: nextPage });
        allRecords.push(...(next.records || []));
      }
      downloadAttendanceCsv(allRecords);
      setNotice(`Exported ${allRecords.length} attendance record${allRecords.length === 1 ? '' : 's'} to CSV.`);
    } catch (err) {
      setExportError(err.message || 'Could not export attendance records.');
    } finally {
      setExporting(false);
    }
  };
  const isFiltered = search || Object.values(filters).some(Boolean);
  const totalPages = Math.max(1, Math.ceil(total / ATTENDANCE_PAGE_SIZE));

  const afterChange = (message) => {
    setEditing(null);
    setDeleting(null);
    setNotice(message);
    load();
    onChanged?.();
  };

  return (
    <div>
      <div
        className="card"
        style={{ padding: '16px 20px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: 1 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name or student code..." style={{ maxWidth: '280px' }} />
          <input
            type="date"
            className="filter-select"
            value={filters.date}
            max={todayISO()}
            onChange={(e) => setFilter('date', e.target.value)}
            aria-label="Filter by date"
          />
          <select className="filter-select" value={filters.grade} onChange={(e) => setFilter('grade', e.target.value)} aria-label="Filter by grade">
            <option value="">All grades</option>
            {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
          </select>
          <select className="filter-select" value={filters.section} onChange={(e) => setFilter('section', e.target.value)} aria-label="Filter by section">
            <option value="">All sections</option>
            {SECTIONS.map((s) => <option key={s} value={s}>Section {s}</option>)}
          </select>
          <select className="filter-select" value={filters.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {ATTENDANCE_STATUSES.map((s) => <option key={s} value={s}>{ATTENDANCE_STATUS_LABELS[s]}</option>)}
          </select>
          {isFiltered && (
            <Button variant="secondary" size="sm" icon={RotateCcw} onClick={reset}>Reset</Button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            {total} record{total === 1 ? '' : 's'}
          </div>
          <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv} disabled={exporting || loading || total === 0}>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
        </div>
      </div>

      {exportError && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: '16px' }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{exportError}</span>
        </div>
      )}

      {notice && (
        <div className="alert alert-success" role="status" style={{ marginBottom: '16px' }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{notice}</span>
        </div>
      )}

      {loading && <LoadingState message="Loading attendance records..." />}
      {!loading && error && <ErrorState title="Unable to Load Records" message={error} onRetry={load} />}
      {!loading && !error && records.length === 0 && (
        <EmptyState
          title="No Attendance Records"
          message={isFiltered ? 'No records match these filters.' : 'No attendance has been recorded yet.'}
          actionLabel={isFiltered ? 'Reset Filters' : undefined}
          onAction={isFiltered ? reset : undefined}
        />
      )}

      {!loading && !error && records.length > 0 && (
        <div className="card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th>Note</th>
                  <th>Recorded by</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id}>
                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{formatDate(rec.date)}</td>
                    <td>
                      <Link to={`/students/${rec.studentId}`} style={{ fontWeight: 600, color: 'var(--color-primary-dark)', textDecoration: 'none' }}>
                        {rec.studentName}
                      </Link>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{rec.studentCode}</div>
                    </td>
                    <td style={{ fontSize: '12px' }}>{formatClass(rec.grade, rec.section)}</td>
                    <td><Badge type="attendance" value={rec.status} /></td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '220px' }}>{rec.note || '—'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{rec.recordedByName || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {canCorrectAttendance(user, rec) && (
                          <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditing(rec)} aria-label={`Correct attendance for ${rec.studentName} on ${formatDate(rec.date)}`}>
                            Correct
                          </Button>
                        )}
                        {can(PERMISSIONS.ATTENDANCE_DELETE) && (
                          <Button variant="danger" size="sm" icon={Trash2} onClick={() => setDeleting(rec)} aria-label={`Delete attendance for ${rec.studentName} on ${formatDate(rec.date)}`}>
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--color-border-subtle)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              <span>Page {page} of {totalPages}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="secondary" size="sm" icon={ChevronRight} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {editing && (
        <CorrectAttendanceModal
          record={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved) => afterChange(`Updated ${saved.studentName}'s attendance for ${formatDate(saved.date)}.`)}
        />
      )}
      {deleting && (
        <DeleteAttendanceModal
          record={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => afterChange(`Deleted ${deleting.studentName}'s attendance for ${formatDate(deleting.date)}.`)}
        />
      )}
    </div>
  );
}

function CorrectAttendanceModal({ record, onClose, onSaved }) {
  const [status, setStatus] = useState(record.status);
  const [note, setNote] = useState(record.note || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      onSaved(await updateAttendance(record.id, { status, note }));
    } catch (err) {
      setError(err.message || 'Could not update this entry.');
    } finally {
      setSaving(false);
    }
  };

  const unchanged = status === record.status && note.trim() === (record.note || '');

  return (
    <Modal
      isOpen
      onClose={saving ? () => {} : onClose}
      title="Correct Attendance"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" size="md" type="submit" form="correct-attendance-form" disabled={saving || unchanged}>
            {saving ? 'Saving...' : 'Save Correction'}
          </Button>
        </>
      }
    >
      <form id="correct-attendance-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && (
          <div className="alert alert-error" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          <strong style={{ color: 'var(--color-text-primary)' }}>{record.studentName}</strong> · {formatDate(record.date)}
        </p>
        <div className="form-group">
          <span className="form-label" id="correct-status-label">Status</span>
          <div className="status-toggle" role="group" aria-labelledby="correct-status-label">
            {ATTENDANCE_STATUSES.map((s) => (
              <button key={s} type="button" data-status={s} aria-pressed={status === s} onClick={() => setStatus(s)} disabled={saving}>
                {ATTENDANCE_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="correct-note">Note</label>
          <input id="correct-note" className="form-input" type="text" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} disabled={saving} placeholder="e.g. Medical certificate received" />
        </div>
      </form>
    </Modal>
  );
}

function DeleteAttendanceModal({ record, onClose, onDeleted }) {
  const [reason, setReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setError('Give a short reason (at least 5 characters).');
      return;
    }
    setDeleting(true);
    setError('');
    try {
      await deleteAttendance(record.id, reason.trim());
      onDeleted();
    } catch (err) {
      setError(err.message || 'Could not delete this entry.');
      setDeleting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={deleting ? () => {} : onClose}
      title="Delete Attendance Entry"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose} disabled={deleting}>Cancel</Button>
          <Button variant="danger" size="md" type="submit" form="delete-attendance-form" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete Entry'}
          </Button>
        </>
      }
    >
      <form id="delete-attendance-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && (
          <div className="alert alert-error" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}
        <p style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>
          Delete the <strong>{ATTENDANCE_STATUS_LABELS[record.status]}</strong> entry for{' '}
          <strong style={{ color: 'var(--color-text-primary)' }}>{record.studentName}</strong> on {formatDate(record.date)}?
          Only do this for an entry recorded by mistake (for example, a day school was closed). To change
          the status, use <em>Correct</em> instead.
        </p>
        <div className="form-group">
          <label className="form-label" htmlFor="delete-reason">Reason *</label>
          <textarea
            id="delete-reason"
            className="form-input"
            rows={2}
            maxLength={300}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={deleting}
            placeholder="e.g. School was closed for a public holiday"
          />
          <span className="form-helper">The reason is kept in the audit log.</span>
        </div>
      </form>
    </Modal>
  );
}
