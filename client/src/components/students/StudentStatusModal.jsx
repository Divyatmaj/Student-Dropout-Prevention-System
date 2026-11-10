import React, { useState } from 'react';
import { AlertCircle, Archive } from 'lucide-react';

import Modal, { ModalCloseButton } from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import { updateStudentStatus } from '../../services/studentService.js';
import {
  STUDENT_STATUS,
  STUDENT_STATUS_LABELS,
  STUDENT_STATUS_HELP,
} from '../../constants/students.js';

/**
 * Change a student's enrolment status. Students are never hard-deleted —
 * deactivating keeps attendance, marks and intervention history.
 */
export default function StudentStatusModal({ isOpen, ...props }) {
  if (!isOpen) return null;
  return <StudentStatusDialog {...props} />;
}

function StudentStatusDialog({ student, onClose, onSaved }) {
  const options = Object.values(STUDENT_STATUS).filter((s) => s !== student.status);
  const [status, setStatus] = useState(
    student.status === STUDENT_STATUS.ACTIVE ? STUDENT_STATUS.INACTIVE : STUDENT_STATUS.ACTIVE
  );
  const initialStatus = student.status === STUDENT_STATUS.ACTIVE ? STUDENT_STATUS.INACTIVE : STUDENT_STATUS.ACTIVE;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const saved = await updateStudentStatus(student.id, status);
      onSaved?.(saved);
    } catch (err) {
      setError(err.message || 'Could not update the status. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      closeDisabled={submitting}
      hasUnsavedChanges={status !== initialStatus}
      title="Change Enrolment Status"
      footer={
        <>
          <ModalCloseButton variant="secondary" size="md" disabled={submitting}>
            Cancel
          </ModalCloseButton>
          <Button
            variant={status === STUDENT_STATUS.ACTIVE ? 'primary' : 'danger'}
            size="md"
            type="submit"
            form="student-status-form"
            disabled={submitting}
          >
            {submitting ? 'Updating...' : `Mark as ${STUDENT_STATUS_LABELS[status]}`}
          </Button>
        </>
      }
    >
      <form
        id="student-status-form"
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
      >
        {error && (
          <div className="alert alert-error" role="alert" aria-live="assertive">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}

        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--color-text-primary)' }}>{student.fullName}</strong> (
          {student.studentCode}) is currently{' '}
          <strong>{STUDENT_STATUS_LABELS[student.status]}</strong>.
        </p>

        <fieldset style={{ border: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <legend className="form-label" style={{ marginBottom: '8px' }}>New status</legend>
          {options.map((option) => (
            <label
              key={option}
              className="form-checkbox"
              style={{
                padding: '10px 12px',
                border: `1px solid ${status === option ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: status === option ? 'var(--color-primary-subtle)' : 'transparent',
              }}
            >
              <input
                type="radio"
                name="status"
                value={option}
                checked={status === option}
                onChange={() => setStatus(option)}
                disabled={submitting}
              />
              <span>
                <strong>{STUDENT_STATUS_LABELS[option]}</strong>
                <span className="form-helper" style={{ display: 'block' }}>
                  {STUDENT_STATUS_HELP[option]}
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="alert alert-info">
          <Archive size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            Udaan never deletes student records. Attendance, marks and intervention history are kept
            and the status can be changed back at any time.
          </span>
        </div>
      </form>
    </Modal>
  );
}
