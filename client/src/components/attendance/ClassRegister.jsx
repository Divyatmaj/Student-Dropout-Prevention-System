import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Info, Save, CheckCheck, Undo2, Users } from 'lucide-react';
import { ATTENDANCE_STATUSES, ATTENDANCE_STATUS_LABELS, ATTENDANCE_REASON_CATEGORIES, ATTENDANCE_REASON_LABELS } from '@udaan/shared';

import Button from '../common/Button.jsx';
import LoadingState from '../common/LoadingState.jsx';
import ErrorState from '../common/ErrorState.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { getClassRegister, saveClassAttendance } from '../../services/attendanceService.js';
import { useAuth } from '../../hooks/useAuth.js';
import { canCorrectAttendance } from '../../utils/permissions.js';
import { GRADES, SECTIONS } from '../../constants/students.js';
import { formatDate, todayISO, formatClass } from '../../utils/formatters.js';

/** Last weekday on or before today — the most likely register to fill in. */
function lastSchoolDay() {
  const date = new Date(`${todayISO()}T00:00:00`);
  while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() - 1);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isWeekend(iso) {
  const day = new Date(`${iso}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

/**
 * Take attendance for one class on one day. Students without a selected
 * status are simply not saved — a missing record never counts as an absence.
 */
export default function ClassRegister({ onSaved }) {
  const { user } = useAuth();
  const [date, setDate] = useState(lastSchoolDay);
  const [grade, setGrade] = useState('8');
  const [section, setSection] = useState('A');

  const [rows, setRows] = useState([]); // [{ student, record, status, note }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!date || !grade) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getClassRegister({ date, grade, section });
      setRows(
        data.students.map(({ student, record }) => ({
          student,
          record,
          status: record?.status ?? '',
          reasonCategory: record?.reasonCategory ?? '',
          note: record?.note ?? '',
        }))
      );
    } catch (err) {
      setError(err.message || 'Could not load the class register.');
    } finally {
      setLoading(false);
    }
  }, [date, grade, section]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const isChanged = (row) =>
    row.status !== '' && (row.status !== (row.record?.status ?? '') || row.reasonCategory !== (row.record?.reasonCategory ?? '') || row.note.trim() !== (row.record?.note ?? ''));

  const changedRows = rows.filter(isChanged);
  const dirty = changedRows.length > 0;

  const counts = useMemo(() => {
    const result = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0, unmarked: 0 };
    rows.forEach((row) => {
      if (row.status) result[row.status] += 1;
      else result.unmarked += 1;
    });
    return result;
  }, [rows]);

  const updateRow = (studentId, patch) => {
    setSaveError('');
    setRows((prev) => prev.map((row) => (row.student.id === studentId ? { ...row, ...patch } : row)));
  };

  const markUnmarkedPresent = () => {
    setRows((prev) => prev.map((row) => (row.status ? row : { ...row, status: 'PRESENT' })));
  };

  const discardChanges = () => {
    setSaveError('');
    setRows((prev) =>
      prev.map((row) => ({ ...row, status: row.record?.status ?? '', reasonCategory: row.record?.reasonCategory ?? '', note: row.record?.note ?? '' }))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const result = await saveClassAttendance({
        date,
        entries: changedRows.map((row) => ({
          studentId: row.student.id,
          status: row.status,
          reasonCategory: row.reasonCategory || null,
          note: row.note.trim(),
        })),
      });
      const parts = [];
      if (result.created) parts.push(`${result.created} new`);
      if (result.updated) parts.push(`${result.updated} corrected`);
      setNotice(`Register saved for ${formatClass(grade, section)} on ${formatDate(date)}${parts.length ? ` (${parts.join(', ')})` : ''}.`);
      await load();
      onSaved?.();
    } catch (err) {
      setSaveError(err.message || 'Could not save the register. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const lockedHint = dirty ? 'Save or discard your changes before switching date or class.' : undefined;

  return (
    <div>
      {/* Register selectors */}
      <div
        className="card"
        style={{ padding: '16px 20px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '12px' }}
      >
        <div className="form-group">
          <label className="form-label" htmlFor="register-date">Date</label>
          <input
            id="register-date"
            className="form-input"
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            disabled={dirty || saving}
            title={lockedHint}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="register-grade">Grade</label>
          <select
            id="register-grade"
            className="form-select"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            disabled={dirty || saving}
            title={lockedHint}
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="register-section">Section</label>
          <select
            id="register-section"
            className="form-select"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            disabled={dirty || saving}
            title={lockedHint}
          >
            <option value="">All sections</option>
            {SECTIONS.map((s) => (
              <option key={s} value={s}>Section {s}</option>
            ))}
          </select>
        </div>
        {dirty && (
          <span className="form-helper" style={{ paddingBottom: '10px' }}>
            {lockedHint}
          </span>
        )}
      </div>

      {notice && (
        <div className="alert alert-success" role="status" style={{ marginBottom: '16px' }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{notice}</span>
        </div>
      )}

      {isWeekend(date) && (
        <div className="alert alert-info" style={{ marginBottom: '16px' }}>
          <Info size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>{formatDate(date)} is a weekend. Only take attendance if school was open that day.</span>
        </div>
      )}

      {loading && <LoadingState message="Loading class register..." />}

      {!loading && error && <ErrorState title="Unable to Load Register" message={error} onRetry={load} />}

      {!loading && !error && rows.length === 0 && (
        <EmptyState
          icon={Users}
          title="No Active Students in This Class"
          message={`There are no active students in ${formatClass(grade, section)}. Choose another class or add students first.`}
        />
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="card" style={{ overflow: 'visible' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">
                {formatClass(grade, section)} · {formatDate(date)}
              </h3>
              <p className="card-subtitle">
                {rows.length} active student{rows.length === 1 ? '' : 's'}. Unmarked students are not
                saved — a missing record is never counted as an absence.
              </p>
            </div>
            <Button variant="secondary" size="sm" icon={CheckCheck} onClick={markUnmarkedPresent} disabled={saving || counts.unmarked === 0}>
              Mark unmarked as present
            </Button>
          </div>

          <div className="table-responsive">
            <table className="data-table mobile-register-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const locked = row.record && !canCorrectAttendance(user, row.record);
                  const changed = isChanged(row);
                  return (
                    <tr key={row.student.id} style={changed ? { backgroundColor: '#fffbeb' } : undefined}>
                      <td>
                        <Link
                          to={`/students/${row.student.id}`}
                          style={{ fontWeight: 600, color: 'var(--color-primary-dark)', textDecoration: 'none' }}
                        >
                          {row.student.fullName}
                        </Link>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          {row.student.studentCode}
                          {!section && row.student.section ? ` · Section ${row.student.section}` : ''}
                          {row.record && !changed && (
                            <span style={{ marginLeft: '6px', color: 'var(--color-risk-low)', fontWeight: 600 }}>
                              • Recorded{row.record.recordedByName ? ` by ${row.record.recordedByName}` : ''}
                            </span>
                          )}
                          {changed && (
                            <span style={{ marginLeft: '6px', color: 'var(--color-accent)', fontWeight: 600 }}>• Unsaved</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div
                          className="status-toggle"
                          role="group"
                          aria-label={`Attendance for ${row.student.fullName}`}
                          title={locked ? 'Only an administrator, principal or the original recorder can correct this entry.' : undefined}
                        >
                          {ATTENDANCE_STATUSES.map((status) => (
                            <button
                              key={status}
                              type="button"
                              data-status={status}
                              aria-pressed={row.status === status}
                              disabled={locked || saving}
                              onClick={() => updateRow(row.student.id, { status, ...(status === 'PRESENT' && { reasonCategory: '' }) })}
                            >
                              {ATTENDANCE_STATUS_LABELS[status]}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td style={{ minWidth: '160px' }}>
                        <select
                          className="form-select"
                          value={row.reasonCategory}
                          aria-label={`Reason for ${row.student.fullName}`}
                          disabled={locked || saving || !row.status || row.status === 'PRESENT'}
                          onChange={(e) => updateRow(row.student.id, { reasonCategory: e.target.value })}
                          style={{ padding: '6px 10px' }}
                        >
                          <option value="">No reason selected</option>
                          {ATTENDANCE_REASON_CATEGORIES.map((reason) => <option key={reason} value={reason}>{ATTENDANCE_REASON_LABELS[reason]}</option>)}
                        </select>
                      </td>
                      <td style={{ minWidth: '180px' }}>
                        <input
                          className="form-input"
                          type="text"
                          value={row.note}
                          maxLength={200}
                          placeholder="Optional note"
                          aria-label={`Note for ${row.student.fullName}`}
                          disabled={locked || saving || !row.status}
                          onChange={(e) => updateRow(row.student.id, { note: e.target.value })}
                          style={{ width: '100%', padding: '6px 10px' }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="register-footer">
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span><strong style={{ color: 'var(--color-risk-low)' }}>{counts.PRESENT}</strong> present</span>
              <span><strong style={{ color: 'var(--color-risk-high)' }}>{counts.ABSENT}</strong> absent</span>
              <span><strong style={{ color: 'var(--color-risk-medium)' }}>{counts.LATE}</strong> late</span>
              <span><strong style={{ color: '#0369a1' }}>{counts.EXCUSED}</strong> excused</span>
              <span><strong>{counts.unmarked}</strong> unmarked</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {saveError && (
                <span className="form-error" role="alert" style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                  <AlertCircle size={13} /> {saveError}
                </span>
              )}
              {dirty && (
                <Button variant="secondary" size="md" icon={Undo2} onClick={discardChanges} disabled={saving}>
                  Discard
                </Button>
              )}
              <Button variant="primary" size="md" icon={Save} onClick={handleSave} disabled={!dirty || saving}>
                {saving ? 'Saving...' : dirty ? `Save ${changedRows.length} change${changedRows.length === 1 ? '' : 's'}` : 'Saved'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
