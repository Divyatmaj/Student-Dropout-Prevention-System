import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, PlayCircle, CheckCircle2, XCircle, RotateCcw, Pencil, MessageSquare } from 'lucide-react';
import { MIN_OUTCOME_LENGTH } from '@udaan/shared';

import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';
import LoadingState from '../common/LoadingState.jsx';
import ErrorState from '../common/ErrorState.jsx';
import { getIntervention, changeInterventionStatus, updateIntervention } from '../../services/interventionService.js';
import { useAuth } from '../../hooks/useAuth.js';
import { canManageIntervention } from '../../utils/permissions.js';
import { formatClass, formatDate, formatDateTime } from '../../utils/formatters.js';
import {
  CONCERN_CATEGORY_LABELS,
  INTERVENTION_STATUS_LABELS,
  HISTORY_LABELS,
} from '../../constants/interventions.js';

/** What each action asks for before it can be saved. */
const ACTIONS = {
  COMPLETED: { title: 'Mark as completed', field: 'outcome', label: 'Outcome *', placeholder: 'What happened? e.g. Attendance back above 90% for two weeks; family has a bus pass.', button: 'Complete' },
  CANCELLED: { title: 'Cancel intervention', field: 'note', label: 'Reason *', placeholder: 'Why is it no longer needed?', button: 'Cancel Intervention' },
  REOPEN: { title: 'Reopen', field: 'note', label: 'Reason *', placeholder: 'Why is it being reopened?', button: 'Reopen' },
  NOTE: { title: 'Add a progress note', field: 'note', label: 'Note *', placeholder: 'e.g. Spoke with the guardian; will check again on Friday.', button: 'Add Note' },
};

function historyText(entry) {
  if (entry.type === 'STATUS_CHANGED') {
    return `${INTERVENTION_STATUS_LABELS[entry.fromStatus]} → ${INTERVENTION_STATUS_LABELS[entry.toStatus]}`;
  }
  if (entry.type === 'UPDATED' && entry.fields?.length) {
    const names = { description: 'concern', actionPlan: 'action plan', priority: 'priority', category: 'category', dueDate: 'due date', followUpDate: 'follow-up date' };
    return `Changed ${entry.fields.map((f) => names[f] || f).join(', ')}`;
  }
  return HISTORY_LABELS[entry.type] || entry.type;
}

export default function InterventionDetailModal({ interventionId, onClose, onChanged, onEdit }) {
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [action, setAction] = useState(null); // key of ACTIONS
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setItem(await getIntervention(interventionId));
    } catch (err) {
      setLoadError(err.message || 'Could not load this intervention.');
    } finally {
      setLoading(false);
    }
  }, [interventionId]);

  useEffect(() => {
    load();
  }, [load]);

  const canManage = item && canManageIntervention(user, item);

  const startAction = (key) => {
    setAction(key);
    setText('');
    setError('');
  };

  const run = async (fn, message) => {
    setSaving(true);
    setError('');
    try {
      const updated = await fn();
      setItem(updated);
      setAction(null);
      setText('');
      onChanged(updated, message);
    } catch (err) {
      setError(err.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const submitAction = () => {
    const value = text.trim();
    const min = action === 'NOTE' ? 3 : MIN_OUTCOME_LENGTH;
    if (value.length < min) {
      setError(action === 'NOTE' ? 'Write a note first.' : `Please write at least ${MIN_OUTCOME_LENGTH} characters.`);
      return;
    }
    if (action === 'NOTE') {
      run(() => updateIntervention(item.id, { note: value }), 'Note added.');
    } else if (action === 'COMPLETED') {
      run(() => changeInterventionStatus(item.id, { status: 'COMPLETED', outcome: value }), 'Intervention completed.');
    } else if (action === 'CANCELLED') {
      run(() => changeInterventionStatus(item.id, { status: 'CANCELLED', note: value }), 'Intervention cancelled.');
    } else if (action === 'REOPEN') {
      const status = item.status === 'COMPLETED' ? 'IN_PROGRESS' : 'OPEN';
      run(() => changeInterventionStatus(item.id, { status, note: value }), 'Intervention reopened.');
    }
  };

  const config = action ? ACTIONS[action] : null;

  return (
    <Modal
      isOpen
      size="lg"
      onClose={saving ? () => {} : onClose}
      title={item ? `${CONCERN_CATEGORY_LABELS[item.category]} support — ${item.student?.fullName ?? ''}` : 'Intervention'}
      footer={<Button variant="secondary" size="md" onClick={onClose} disabled={saving}>Close</Button>}
    >
      {loading && <LoadingState message="Loading intervention..." />}
      {!loading && loadError && <ErrorState title="Unable to Load Intervention" message={loadError} onRetry={load} />}

      {!loading && !loadError && item && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Status line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Badge type="status" value={item.status} />
            <Badge type="priority" value={item.priority} />
            {item.isOverdue && <Badge type="overdue">Overdue by {item.daysOverdue} day{item.daysOverdue === 1 ? '' : 's'}</Badge>}
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: 'auto' }} title={item.id}>
              {/^[0-9a-f-]{36}$/i.test(item.id) ? `#${item.id.slice(0, 8)}` : item.id}
            </span>
          </div>

          <div className="detail-grid">
            <div>
              <span className="detail-label">Student</span>
              {item.student ? (
                <Link to={`/students/${item.student.id}`} style={{ fontWeight: 600, color: 'var(--color-primary-dark)' }}>
                  {item.student.fullName}
                </Link>
              ) : '—'}
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {item.student && `${item.student.studentCode} · ${formatClass(item.student.grade, item.student.section)}`}
              </div>
            </div>
            <div><span className="detail-label">Owner</span>{item.assignedToName || 'Unassigned'}</div>
            <div><span className="detail-label">Due</span>{formatDate(item.dueDate)}</div>
            <div><span className="detail-label">Follow-up</span>{formatDate(item.followUpDate)}</div>
            <div><span className="detail-label">Opened</span>{formatDate(item.createdAt)} by {item.createdByName}</div>
          </div>

          <div>
            <span className="detail-label">Concern</span>
            <p style={{ fontSize: '14px', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{item.description}</p>
          </div>
          <div>
            <span className="detail-label">Action plan</span>
            <p style={{ fontSize: '14px', lineHeight: 1.55, whiteSpace: 'pre-wrap', color: item.actionPlan ? 'inherit' : 'var(--color-text-muted)' }}>
              {item.actionPlan || 'No plan written yet.'}
            </p>
          </div>
          {item.outcome && (
            <div className="alert alert-success" style={{ display: 'block' }}>
              <span className="detail-label" style={{ color: 'inherit' }}>Outcome</span>
              {item.outcome}
            </div>
          )}

          {item.riskSnapshot && (
            <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg-muted)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <strong>Risk indicator when opened:</strong>
                <Badge type="risk" value={item.riskSnapshot.category} />
                <span>score {item.riskSnapshot.score}</span>
              </div>
              {item.riskSnapshot.reasons.length > 0 ? (
                <ul style={{ paddingLeft: '18px', color: 'var(--color-text-secondary)' }}>
                  {item.riskSnapshot.reasons.map((r) => <li key={r.code}>{r.label} (+{r.points})</li>)}
                </ul>
              ) : (
                <span style={{ color: 'var(--color-text-secondary)' }}>No rules were triggered.</span>
              )}
            </div>
          )}

          {/* Actions */}
          {canManage && !config && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {item.status === 'OPEN' && (
                <Button variant="secondary" size="sm" icon={PlayCircle} disabled={saving}
                  onClick={() => run(() => changeInterventionStatus(item.id, { status: 'IN_PROGRESS' }), 'Marked as in progress.')}>
                  Start
                </Button>
              )}
              {item.isOpen && (
                <>
                  <Button variant="primary" size="sm" icon={CheckCircle2} onClick={() => startAction('COMPLETED')}>Complete</Button>
                  <Button variant="secondary" size="sm" icon={Pencil} onClick={() => onEdit(item)}>Edit Plan</Button>
                  <Button variant="secondary" size="sm" icon={MessageSquare} onClick={() => startAction('NOTE')}>Add Note</Button>
                  <Button variant="secondary" size="sm" icon={XCircle} onClick={() => startAction('CANCELLED')}>Cancel</Button>
                </>
              )}
              {!item.isOpen && (
                <Button variant="secondary" size="sm" icon={RotateCcw} onClick={() => startAction('REOPEN')}>Reopen</Button>
              )}
            </div>
          )}
          {!canManage && item.isOpen && (
            <p className="form-helper">Only the owner, the creator, a principal or a school admin can update this intervention.</p>
          )}
          {error && !config && (
            <div className="alert alert-error" role="alert">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{error}</span>
            </div>
          )}

          {config && (
            <div style={{ padding: '14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <strong style={{ fontSize: '14px' }}>{config.title}</strong>
              <div className="form-group">
                <label className="form-label" htmlFor="intervention-action-text">{config.label}</label>
                <textarea
                  id="intervention-action-text"
                  className="form-input"
                  rows={3}
                  maxLength={1000}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setError('');
                  }}
                  disabled={saving}
                  placeholder={config.placeholder}
                  aria-invalid={error ? 'true' : 'false'}
                  autoFocus
                />
                {error && <span className="form-error" role="alert">{error}</span>}
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button variant="secondary" size="sm" onClick={() => setAction(null)} disabled={saving}>Back</Button>
                <Button variant="primary" size="sm" onClick={submitAction} disabled={saving}>
                  {saving ? 'Saving...' : config.button}
                </Button>
              </div>
            </div>
          )}

          {/* History */}
          <div>
            <span className="detail-label" style={{ marginBottom: '10px' }}>History</span>
            <ol className="timeline">
              {[...item.history].reverse().map((entry) => (
                <li key={entry.id} className="timeline-item">
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{historyText(entry)}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {entry.byName} · {formatDateTime(entry.at)}
                  </div>
                  {entry.note && <p style={{ fontSize: '13px', marginTop: '4px', lineHeight: 1.5 }}>{entry.note}</p>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </Modal>
  );
}
