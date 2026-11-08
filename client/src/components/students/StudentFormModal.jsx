import React, { useState, useEffect } from 'react';
import { AlertCircle, Lock } from 'lucide-react';

import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import { createStudent, updateStudent } from '../../services/studentService.js';
import { getAssignableStaff } from '../../services/staffService.js';
import { STUDENT_ENROLMENT_FIELDS } from '@udaan/shared';
import { useAuth } from '../../hooks/useAuth.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import { GRADES, SECTIONS, GUARDIAN_RELATIONSHIPS } from '../../constants/students.js';
import { todayISO } from '../../utils/formatters.js';
import {
  studentToFormValues,
  toStudentPayload,
  validateStudentForm,
  apiDetailsToFieldErrors,
} from '../../utils/studentValidation.js';

/** Fields only school admins / principals may change (shared with the API). */
const ENROLMENT_FIELDS = STUDENT_ENROLMENT_FIELDS;

const FORM_ID = 'student-form';

/**
 * Create or edit a student.
 *
 * @param {boolean}  isOpen
 * @param {object?}  student   Existing student to edit; omit to create.
 * @param {Function} onClose
 * @param {Function} onSaved   Called with the saved student.
 */
export default function StudentFormModal({ isOpen, ...props }) {
  // Mount the form only while open so it starts fresh every time.
  if (!isOpen) return null;
  return <StudentFormDialog {...props} />;
}

function StudentFormDialog({ student = null, onClose, onSaved }) {
  const { can } = useAuth();
  const isEdit = Boolean(student);
  const canEditEnrolment = !isEdit || can(PERMISSIONS.STUDENT_EDIT_ENROLMENT);

  const [values, setValues] = useState(() => studentToFormValues(student));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [teachersError, setTeachersError] = useState('');

  // Class teacher options (teachers see only students assigned to them).
  useEffect(() => {
    if (!canEditEnrolment) return undefined;
    let cancelled = false;
    getAssignableStaff()
      .then(({ users }) => !cancelled && setTeachers(users.filter((u) => u.role === 'TEACHER')))
      .catch(() => !cancelled && setTeachersError('Could not load teachers. You can assign one later.'));
    return () => {
      cancelled = true;
    };
  }, [canEditEnrolment]);

  const setField = (field, value) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (touched[field] || errors[field]) {
      const fieldError = validateStudentForm(next)[field];
      setErrors((prev) => ({ ...prev, [field]: fieldError }));
    }
  };

  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateStudentForm(values)[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const validation = validateStudentForm(values);
    setErrors(validation);
    setTouched(Object.fromEntries(Object.keys(values).map((k) => [k, true])));
    if (Object.keys(validation).length > 0) {
      setFormError('Please fix the highlighted fields.');
      return;
    }

    let payload = toStudentPayload(values);
    if (!canEditEnrolment) {
      // Teachers send only the fields they're allowed to change.
      payload = Object.fromEntries(
        Object.entries(payload).filter(([key]) => !ENROLMENT_FIELDS.includes(key))
      );
    }

    setSubmitting(true);
    try {
      const saved = isEdit ? await updateStudent(student.id, payload) : await createStudent(payload);
      onSaved?.(saved);
    } catch (err) {
      const fieldErrors = apiDetailsToFieldErrors(err.details);
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      setFormError(err.message || 'Could not save the student. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /** Props shared by every input: value, change/blur handlers, a11y wiring. */
  const fieldProps = (field) => ({
    id: `student-${field}`,
    name: field,
    value: values[field],
    onChange: (e) => setField(field, e.target.value),
    onBlur: () => markTouched(field),
    disabled: submitting || (!canEditEnrolment && ENROLMENT_FIELDS.includes(field)),
    'aria-invalid': errors[field] ? 'true' : 'false',
    'aria-describedby': errors[field] ? `student-${field}-error` : undefined,
  });

  const fieldError = (field) =>
    errors[field] ? (
      <span id={`student-${field}-error`} className="form-error">
        {errors[field]}
      </span>
    ) : null;

  return (
    <Modal
      isOpen
      onClose={submitting ? () => {} : onClose}
      title={isEdit ? `Edit ${student.fullName}` : 'Add Student'}
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" form={FORM_ID} disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Student'}
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
      >
        {formError && (
          <div className="alert alert-error" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{formError}</span>
          </div>
        )}

        {!canEditEnrolment && (
          <div className="alert alert-info">
            <Lock size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>
              Enrolment details can only be changed by a school administrator or principal. You can
              update guardian contact and support information.
            </span>
          </div>
        )}

        <div className="form-section-title" style={{ borderTop: 'none', paddingTop: 0 }}>
          Enrolment
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="student-studentCode">Student code *</label>
            <input
              {...fieldProps('studentCode')}
              className="form-input"
              type="text"
              placeholder="UDN-0101"
              autoComplete="off"
              style={{ textTransform: 'uppercase' }}
            />
            {fieldError('studentCode') || (
              <span className="form-helper">Must be unique within the school.</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="student-fullName">Full name *</label>
            <input
              {...fieldProps('fullName')}
              className="form-input"
              type="text"
              placeholder="e.g. Riya Patil"
              autoComplete="off"
            />
            {fieldError('fullName')}
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="student-grade">Grade *</label>
            <select {...fieldProps('grade')} className="form-select">
              <option value="">Select grade</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
            {fieldError('grade')}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="student-section">Section</label>
            <select {...fieldProps('section')} className="form-select">
              <option value="">No section</option>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>
            {fieldError('section')}
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="student-dateOfBirth">Date of birth</label>
            <input {...fieldProps('dateOfBirth')} className="form-input" type="date" max={todayISO()} />
            {fieldError('dateOfBirth')}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="student-admissionDate">Admission date</label>
            <input {...fieldProps('admissionDate')} className="form-input" type="date" max={todayISO()} />
            {fieldError('admissionDate')}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="student-assignedTeacherId">Class teacher</label>
          <select {...fieldProps('assignedTeacherId')} className="form-select">
            <option value="">Not assigned</option>
            {student?.assignedTeacherId && !teachers.some((t) => t.id === student.assignedTeacherId) && (
              <option value={student.assignedTeacherId}>{student.assignedTeacherName ?? 'Current teacher'}</option>
            )}
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {fieldError('assignedTeacherId') || (
            <span className="form-helper">
              {teachersError || 'Teachers see, mark and support only the students assigned to them.'}
            </span>
          )}
        </div>

        <div className="form-section-title">Guardian contact</div>

        <div className="form-group">
          <label className="form-label" htmlFor="student-guardianName">Guardian name</label>
          <input
            {...fieldProps('guardianName')}
            className="form-input"
            type="text"
            placeholder="e.g. Anita Patil"
            autoComplete="off"
          />
          {fieldError('guardianName')}
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="student-guardianPhone">Guardian phone</label>
            <input
              {...fieldProps('guardianPhone')}
              className="form-input"
              type="tel"
              inputMode="tel"
              placeholder="e.g. 9000000000"
              autoComplete="off"
            />
            {fieldError('guardianPhone')}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="student-guardianRelationship">Relationship</label>
            <select {...fieldProps('guardianRelationship')} className="form-select">
              <option value="">Select relationship</option>
              {GUARDIAN_RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {fieldError('guardianRelationship')}
          </div>
        </div>

        <div className="form-section-title">Support information</div>

        <label className="form-checkbox" htmlFor="student-financialBarrierReported">
          <input
            id="student-financialBarrierReported"
            type="checkbox"
            checked={values.financialBarrierReported}
            onChange={(e) => setField('financialBarrierReported', e.target.checked)}
            disabled={submitting}
          />
          <span>
            Financial barrier reported
            <span className="form-helper" style={{ display: 'block' }}>
              Tick only when the family or student has told staff about a cost-related barrier
              (fees, transport, uniform). Adds to the risk score for staff review.
            </span>
          </span>
        </label>

        <div className="form-group">
          <label className="form-label" htmlFor="student-supportNotes">Support notes</label>
          <textarea
            {...fieldProps('supportNotes')}
            className="form-input"
            rows={3}
            maxLength={1000}
            placeholder="Context that helps staff support this student. Avoid sensitive family details unless needed."
          />
          {fieldError('supportNotes') || (
            <span className="form-helper">
              Visible to authorised school staff only. {values.supportNotes.length}/1000
            </span>
          )}
        </div>
      </form>
    </Modal>
  );
}
