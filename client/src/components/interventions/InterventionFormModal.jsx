import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { validateInterventionFields, CONCERN_CATEGORIES, INTERVENTION_PRIORITIES } from '@udaan/shared';

import Modal, { ModalCloseButton } from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';
import LoadingState from '../common/LoadingState.jsx';
import ErrorState from '../common/ErrorState.jsx';
import { createIntervention, updateIntervention } from '../../services/interventionService.js';
import { getStudents } from '../../services/studentService.js';
import { getStudentRisk } from '../../services/riskService.js';
import { getAssignableStaff } from '../../services/staffService.js';
import { useAuth } from '../../hooks/useAuth.js';
import { ROLE_LABELS } from '../../utils/permissions.js';
import { apiDetailsToFieldErrors } from '../../utils/studentValidation.js';
import { todayISO, addDaysISO, formatClass } from '../../utils/formatters.js';
import { focusFirstInvalidField } from '../../utils/formAccessibility.js';
import {
  CONCERN_CATEGORY_LABELS,
  CONCERN_CATEGORY_HELP,
  INTERVENTION_PRIORITY_LABELS,
} from '../../constants/interventions.js';

const EDITABLE = ['category', 'priority', 'description', 'actionPlan', 'assignedToId', 'dueDate', 'followUpDate'];

function initialFormValues({ isEdit, intervention, initialStudentId, userId }) {
  return isEdit
    ? Object.fromEntries(EDITABLE.map((k) => [k, intervention[k] ?? '']))
    : {
        studentId: initialStudentId,
        category: '',
        priority: 'MEDIUM',
        description: '',
        actionPlan: '',
        assignedToId: userId ?? '',
        dueDate: addDaysISO(todayISO(), 7),
        followUpDate: '',
      };
}

function toErrors(details) {
  return details.reduce((acc, d) => ({ ...acc, [d.field]: d.message }), {});
}

/**
 * Create an intervention, or edit the plan of an open one.
 * @param intervention  existing intervention to edit, or null to create
 * @param initialStudentId  preselect a student when creating
 */
export default function InterventionFormModal({ intervention = null, initialStudentId = '', onClose, onSaved }) {
  const { user } = useAuth();
  const isEdit = Boolean(intervention);

  const initialValues = initialFormValues({ isEdit, intervention, initialStudentId, userId: user?.id });
  const [values, setValues] = useState(initialValues);
  const [note, setNote] = useState('');
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadOptions = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [staffResult, studentResult] = await Promise.all([
        getAssignableStaff(),
        isEdit ? Promise.resolve(null) : getStudents({ status: 'ACTIVE', limit: 500 }),
      ]);
      setStaff(staffResult.users);
      if (studentResult) setStudents(studentResult.students);
    } catch (err) {
      setLoadError(err.message || 'Could not load the form options.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show the student's current risk reasons — they are saved with the intervention.
  useEffect(() => {
    if (isEdit || !values.studentId) {
      setRisk(null);
      return undefined;
    }
    let cancelled = false;
    getStudentRisk(values.studentId)
      .then((r) => {
        if (cancelled) return;
        setRisk(r);
        setValues((prev) => (prev.priority === 'MEDIUM' && r.category === 'HIGH' ? { ...prev, priority: 'HIGH' } : prev));
      })
      .catch(() => !cancelled && setRisk(null));
    return () => {
      cancelled = true;
    };
  }, [isEdit, values.studentId]);

  const set = (field) => (e) => {
    const next = { ...values, [field]: e.target.value };
    setValues(next);
    setFormError('');
    if (errors[field]) {
      const v = toErrors(validateInterventionFields(next, { partial: isEdit }));
      setErrors((prev) => ({ ...prev, [field]: v[field] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...values,
      description: values.description.trim(),
      actionPlan: values.actionPlan.trim() || null,
      followUpDate: values.followUpDate || null,
    };
    const v = toErrors(validateInterventionFields(payload, { partial: isEdit }));
    setErrors(v);
    if (Object.keys(v).length) {
      setFormError('Check the highlighted fields, then save the intervention again.');
      focusFirstInvalidField('intervention-form');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      let saved;
      if (isEdit) {
        const changes = Object.fromEntries(
          EDITABLE.filter((k) => (payload[k] || null) !== (intervention[k] || null)).map((k) => [k, payload[k]])
        );
        if (Object.keys(changes).length === 0 && !note.trim()) {
          setSaving(false);
          onClose();
          return;
        }
        saved = await updateIntervention(intervention.id, { ...changes, ...(note.trim() ? { note: note.trim() } : {}) });
      } else {
        saved = await createIntervention(payload);
      }
      onSaved(saved);
    } catch (err) {
      const fieldErrors = apiDetailsToFieldErrors(err.details);
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      setFormError(err.message || 'Could not save the intervention.');
      if (Object.keys(fieldErrors).length) focusFirstInvalidField('intervention-form');
      setSaving(false);
    }
  };

  const field = (name) => ({
    id: `intervention-${name}`,
    value: values[name] ?? '',
    onChange: set(name),
    disabled: saving,
    'aria-invalid': errors[name] ? 'true' : 'false',
    'aria-describedby': errors[name] ? `intervention-${name}-error` : undefined,
  });
  const error = (name) =>
    errors[name] ? <span id={`intervention-${name}-error`} className="form-error">{errors[name]}</span> : null;

  const ownerInactive = isEdit && values.assignedToId && !staff.some((s) => s.id === values.assignedToId);

  return (
    <Modal
      isOpen
      size="lg"
      onClose={onClose}
      closeDisabled={saving}
      hasUnsavedChanges={JSON.stringify(values) !== JSON.stringify(initialValues) || Boolean(note.trim())}
      title={isEdit ? `Edit plan — ${intervention.student?.fullName ?? intervention.id}` : 'New Intervention'}
      footer={
        <>
          <ModalCloseButton variant="secondary" size="md" disabled={saving}>Cancel</ModalCloseButton>
          <Button variant="primary" size="md" type="submit" form="intervention-form" disabled={saving || loading || Boolean(loadError)}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Intervention'}
          </Button>
        </>
      }
    >
      {loading && <LoadingState message="Loading..." />}
      {!loading && loadError && <ErrorState title="Unable to Load Form" message={loadError} onRetry={loadOptions} />}

      {!loading && !loadError && (
        <form id="intervention-form" onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {formError && (
            <div className="alert alert-error" role="alert" aria-live="assertive">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{formError}</span>
            </div>
          )}

          {!isEdit && (
            <div className="form-group">
              <label className="form-label" htmlFor="intervention-studentId">Student *</label>
              <select {...field('studentId')} className="form-select">
                <option value="">Select a student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} — {s.studentCode}, {formatClass(s.grade, s.section)}
                  </option>
                ))}
              </select>
              {error('studentId')}
            </div>
          )}

          {!isEdit && risk && (
            <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg-muted)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: risk.reasons.length ? '6px' : 0 }}>
                <strong>Current risk indicator:</strong>
                <Badge type="risk" value={risk.category} />
                {risk.category !== 'INSUFFICIENT_DATA' && <span>score {risk.score}</span>}
              </div>
              {risk.reasons.length > 0 && (
                <ul style={{ paddingLeft: '18px', color: 'var(--color-text-secondary)' }}>
                  {risk.reasons.map((r) => <li key={r.code}>{r.label} (+{r.points})</li>)}
                </ul>
              )}
              <div className="form-helper" style={{ marginTop: '6px' }}>
                These reasons are saved with the intervention so you can see later what prompted it.
              </div>
            </div>
          )}

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="intervention-category">Concern *</label>
              <select {...field('category')} className="form-select">
                <option value="">Select a concern</option>
                {CONCERN_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CONCERN_CATEGORY_LABELS[c]} — {CONCERN_CATEGORY_HELP[c]}</option>
                ))}
              </select>
              {error('category')}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="intervention-priority">Priority *</label>
              <select {...field('priority')} className="form-select">
                {INTERVENTION_PRIORITIES.slice().reverse().map((p) => (
                  <option key={p} value={p}>{INTERVENTION_PRIORITY_LABELS[p]}</option>
                ))}
              </select>
              {error('priority')}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="intervention-description">What is the concern? *</label>
            <textarea
              {...field('description')}
              className="form-input"
              rows={3}
              maxLength={2000}
              placeholder="What has been noticed, in plain words. e.g. Absent five days in a row with no message from home."
            />
            {error('description')}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="intervention-actionPlan">Action plan</label>
            <textarea
              {...field('actionPlan')}
              className="form-input"
              rows={2}
              maxLength={2000}
              placeholder="What will be done, and by when. e.g. Call the guardian; arrange catch-up lessons."
            />
            {error('actionPlan')}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="intervention-assignedToId">Owner *</label>
            <select {...field('assignedToId')} className="form-select">
              <option value="">Select a staff member</option>
              {ownerInactive && <option value={values.assignedToId}>{intervention.assignedToName} (inactive)</option>}
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {ROLE_LABELS[s.role]}{s.id === user?.id ? ' (you)' : ''}
                </option>
              ))}
            </select>
            {error('assignedToId')}
            {!error('assignedToId') && <span className="form-helper">The person responsible for following this up.</span>}
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="intervention-dueDate">Due date *</label>
              <input {...field('dueDate')} className="form-input" type="date" />
              {error('dueDate')}
              {!error('dueDate') && <span className="form-helper">When the action should be done. Shown as overdue after this date.</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="intervention-followUpDate">Follow-up date</label>
              <input {...field('followUpDate')} className="form-input" type="date" min={values.dueDate || undefined} />
              {error('followUpDate')}
              {!error('followUpDate') && <span className="form-helper">When to check back on how the student is doing.</span>}
            </div>
          </div>

          {isEdit && (
            <div className="form-group">
              <label className="form-label" htmlFor="intervention-note">Note about this change</label>
              <input
                id="intervention-note"
                className="form-input"
                type="text"
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={saving}
                placeholder="Optional — e.g. Moved the due date: guardian is away until Monday."
              />
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}
