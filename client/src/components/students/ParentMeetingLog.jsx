import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, PlusCircle, Users } from 'lucide-react';

import Modal, { ModalCloseButton } from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import LoadingState from '../common/LoadingState.jsx';
import ErrorState from '../common/ErrorState.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { createParentMeeting, getParentMeetings } from '../../services/parentMeetingService.js';
import { apiDetailsToFieldErrors } from '../../utils/studentValidation.js';
import { focusFirstInvalidField } from '../../utils/formAccessibility.js';
import { formatDate, todayISO } from '../../utils/formatters.js';
import { useAuth } from '../../hooks/useAuth.js';
import { PERMISSIONS } from '../../utils/permissions.js';

const FORM_ID = 'parent-meeting-form';

export default function ParentMeetingLog({ studentId }) {
  const { can } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMeetings(await getParentMeetings(studentId));
    } catch (err) {
      setError(err.message || 'Could not load family meeting notes.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreated = (meeting) => {
    setMeetings((current) => [meeting, ...current].sort((a, b) => b.meetingDate.localeCompare(a.meetingDate)));
    setCreating(false);
    setNotice(`Meeting from ${formatDate(meeting.meetingDate)} recorded.`);
  };

  return (
    <section className="card parent-meeting-card" aria-labelledby="parent-meetings-title">
      <div className="card-header">
        <div>
          <h3 className="card-title" id="parent-meetings-title">
            <Users size={18} color="var(--color-primary)" /> Parent &amp; Guardian Meetings
          </h3>
          <p className="card-subtitle">Meeting notes and agreed next steps, visible to staff authorized for this student. Entries are kept as history.</p>
        </div>
        {can(PERMISSIONS.PARENT_MEETINGS_CREATE) && (
          <Button variant="primary" size="sm" icon={PlusCircle} onClick={() => setCreating(true)}>
            Log Meeting
          </Button>
        )}
      </div>

      {notice && (
        <div className="alert alert-success" role="status" style={{ margin: '16px 20px 0' }}>
          <CheckCircle2 size={16} aria-hidden="true" /> <span>{notice}</span>
        </div>
      )}
      {loading && <LoadingState title="Loading Meeting Notes" message="Getting the student’s family meeting history." />}
      {!loading && error && <ErrorState title="Unable to Load Meetings" message={error} onRetry={load} />}
      {!loading && !error && meetings.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="No Meetings Logged"
          message="Record a family meeting to keep its attendees, notes, and agreed follow-up actions with this student’s history."
          actionLabel={can(PERMISSIONS.PARENT_MEETINGS_CREATE) ? 'Log First Meeting' : undefined}
          onAction={can(PERMISSIONS.PARENT_MEETINGS_CREATE) ? () => setCreating(true) : undefined}
        />
      )}

      {!loading && !error && meetings.length > 0 && (
        <div className="parent-meeting-list">
          {meetings.map((meeting) => (
            <article key={meeting.id} className="parent-meeting-entry">
              <div className="parent-meeting-entry-header">
                <strong>Meeting · {formatDate(meeting.meetingDate)}</strong>
                <span className="form-helper">Logged by {meeting.createdByName || 'Staff'}</span>
              </div>
              <div className="parent-meeting-field">
                <span className="detail-label">Attendees</span>
                <p>{meeting.attendees}</p>
              </div>
              <div className="parent-meeting-field">
                <span className="detail-label">Meeting notes</span>
                <p>{meeting.notes}</p>
              </div>
              {(meeting.followUpActions || meeting.followUpDate) && (
                <div className="parent-meeting-field">
                  <span className="detail-label">Agreed follow-up actions</span>
                  {meeting.followUpActions && <p>{meeting.followUpActions}</p>}
                  {meeting.followUpDate && <span className="form-helper">Follow up by {formatDate(meeting.followUpDate)}</span>}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {creating && (
        <ParentMeetingFormModal
          studentId={studentId}
          onClose={() => setCreating(false)}
          onCreated={handleCreated}
        />
      )}
    </section>
  );
}

function validate(values) {
  const errors = {};
  if (!values.meetingDate) errors.meetingDate = 'Choose the meeting date.';
  if (values.attendees.trim().length < 2) errors.attendees = 'Enter who attended the meeting.';
  if (values.attendees.length > 500) errors.attendees = 'Keep attendees under 500 characters.';
  if (values.notes.trim().length < 5) errors.notes = 'Add a short summary of the discussion.';
  if (values.notes.length > 4000) errors.notes = 'Keep meeting notes under 4,000 characters.';
  if (values.followUpActions.length > 4000) errors.followUpActions = 'Keep follow-up actions under 4,000 characters.';
  if (values.followUpDate && values.followUpDate < values.meetingDate) {
    errors.followUpDate = 'Follow-up date must be on or after the meeting date.';
  }
  return errors;
}

function ParentMeetingFormModal({ studentId, onClose, onCreated }) {
  const initialValues = useMemo(() => ({
    meetingDate: todayISO(),
    attendees: '',
    notes: '',
    followUpActions: '',
    followUpDate: '',
  }), []);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const setField = (field, value) => {
    const next = { ...values, [field]: value };
    setValues(next);
    setFormError('');
    if (errors[field]) setErrors((current) => ({ ...current, [field]: validate(next)[field] }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validate(values);
    setErrors(validation);
    if (Object.keys(validation).length) {
      setFormError('Check the highlighted fields, then save the meeting again.');
      focusFirstInvalidField(FORM_ID);
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const meeting = await createParentMeeting(studentId, {
        meetingDate: values.meetingDate,
        attendees: values.attendees.trim(),
        notes: values.notes.trim(),
        followUpActions: values.followUpActions.trim() || null,
        followUpDate: values.followUpDate || null,
      });
      onCreated(meeting);
    } catch (err) {
      const fieldErrors = apiDetailsToFieldErrors(err.details);
      setErrors((current) => ({ ...current, ...fieldErrors }));
      setFormError(err.message || 'Could not record the meeting.');
      if (Object.keys(fieldErrors).length) focusFirstInvalidField(FORM_ID);
      setSaving(false);
    }
  };

  const fieldProps = (field) => ({
    id: `parent-meeting-${field}`,
    value: values[field],
    onChange: (event) => setField(field, event.target.value),
    disabled: saving,
    'aria-invalid': errors[field] ? 'true' : 'false',
    'aria-describedby': errors[field] ? `parent-meeting-${field}-error` : undefined,
  });
  const fieldError = (field) => errors[field] && (
    <span className="form-error" id={`parent-meeting-${field}-error`} role="alert">{errors[field]}</span>
  );

  return (
    <Modal
      isOpen
      size="lg"
      title="Log Parent or Guardian Meeting"
      onClose={onClose}
      closeDisabled={saving}
      hasUnsavedChanges={Object.keys(initialValues).some((key) => values[key] !== initialValues[key])}
      footer={(
        <>
          <ModalCloseButton variant="secondary" size="md" disabled={saving}>Cancel</ModalCloseButton>
          <Button variant="primary" size="md" type="submit" form={FORM_ID} disabled={saving}>
            {saving ? 'Saving…' : 'Save Meeting'}
          </Button>
        </>
      )}
    >
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="meeting-form">
        {formError && <div className="alert alert-error" role="alert" aria-live="assertive"><AlertCircle size={16} /><span>{formError}</span></div>}

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="parent-meeting-meetingDate">Meeting date *</label>
            <input {...fieldProps('meetingDate')} className="form-input" type="date" />
            {fieldError('meetingDate')}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="parent-meeting-followUpDate">Follow-up date</label>
            <input {...fieldProps('followUpDate')} className="form-input" type="date" />
            {fieldError('followUpDate')}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="parent-meeting-attendees">Who attended? *</label>
          <textarea {...fieldProps('attendees')} className="form-input" rows={2} maxLength={500} placeholder="e.g. Parent or guardian, class teacher, counselor" />
          {fieldError('attendees')}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="parent-meeting-notes">Key notes *</label>
          <textarea {...fieldProps('notes')} className="form-input" rows={4} maxLength={4000} placeholder="Summarize the discussion and any relevant context." />
          {fieldError('notes')}
          <span className="form-helper">Keep notes factual and focused on the student’s support.</span>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="parent-meeting-followUpActions">Agreed follow-up actions</label>
          <textarea {...fieldProps('followUpActions')} className="form-input" rows={3} maxLength={4000} placeholder="Who will do what next? Leave blank if no action was agreed." />
          {fieldError('followUpActions')}
        </div>

        <p className="form-helper">These notes are sensitive student records and are visible only to staff authorized to view this student.</p>
      </form>
    </Modal>
  );
}
