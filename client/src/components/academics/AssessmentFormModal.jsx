import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import { createAssessment } from '../../services/academicService.js';
import { apiDetailsToFieldErrors } from '../../utils/studentValidation.js';
import { GRADES, SECTIONS } from '../../constants/students.js';
import { SUBJECTS } from '../../constants/academics.js';
import { todayISO } from '../../utils/formatters.js';

const EMPTY = { title: '', subject: '', grade: '', section: '', assessmentDate: todayISO(), maxMarks: '25' };

function validate(values) {
  const errors = {};
  if (values.title.trim().length < 2) errors.title = 'Enter a title, e.g. Unit Test 3.';
  if (!values.subject) errors.subject = 'Choose a subject.';
  if (!values.grade) errors.grade = 'Choose a grade.';
  if (!values.assessmentDate) errors.assessmentDate = 'Choose a date.';
  else if (values.assessmentDate > todayISO()) errors.assessmentDate = 'The date cannot be in the future.';
  const max = Number(values.maxMarks);
  if (!Number.isFinite(max) || max <= 0 || max > 1000) errors.maxMarks = 'Enter a number from 1 to 1000.';
  return errors;
}

export default function AssessmentFormModal({ onClose, onCreated }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => {
    const next = { ...values, [field]: e.target.value };
    setValues(next);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: validate(next)[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate(values);
    setErrors(v);
    if (Object.keys(v).length) {
      setFormError('Please fix the highlighted fields.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const created = await createAssessment({
        title: values.title.trim(),
        subject: values.subject,
        grade: values.grade,
        section: values.section || null,
        assessmentDate: values.assessmentDate,
        maxMarks: Number(values.maxMarks),
      });
      onCreated(created);
    } catch (err) {
      setErrors((prev) => ({ ...prev, ...apiDetailsToFieldErrors(err.details) }));
      setFormError(err.message || 'Could not create the assessment.');
      setSaving(false);
    }
  };

  const field = (name) => ({
    id: `assessment-${name}`,
    value: values[name],
    onChange: set(name),
    disabled: saving,
    'aria-invalid': errors[name] ? 'true' : 'false',
    'aria-describedby': errors[name] ? `assessment-${name}-error` : undefined,
  });
  const error = (name) =>
    errors[name] ? <span id={`assessment-${name}-error`} className="form-error">{errors[name]}</span> : null;

  return (
    <Modal
      isOpen
      onClose={saving ? () => {} : onClose}
      title="New Assessment"
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" size="md" type="submit" form="assessment-form" disabled={saving}>
            {saving ? 'Creating...' : 'Create & Enter Marks'}
          </Button>
        </>
      }
    >
      <form id="assessment-form" onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {formError && (
          <div className="alert alert-error" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{formError}</span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="assessment-title">Title *</label>
          <input {...field('title')} className="form-input" type="text" maxLength={100} placeholder="e.g. Unit Test 3" />
          {error('title')}
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="assessment-subject">Subject *</label>
            <select {...field('subject')} className="form-select">
              <option value="">Select subject</option>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {error('subject')}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="assessment-maxMarks">Maximum marks *</label>
            <input {...field('maxMarks')} className="form-input" type="number" min="1" max="1000" step="0.5" inputMode="decimal" />
            {error('maxMarks')}
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="assessment-grade">Grade *</label>
            <select {...field('grade')} className="form-select">
              <option value="">Select grade</option>
              {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
            </select>
            {error('grade')}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="assessment-section">Section</label>
            <select {...field('section')} className="form-select">
              <option value="">Whole grade</option>
              {SECTIONS.map((s) => <option key={s} value={s}>Section {s}</option>)}
            </select>
            {error('section')}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="assessment-assessmentDate">Date *</label>
          <input {...field('assessmentDate')} className="form-input" type="date" max={todayISO()} />
          {error('assessmentDate')}
        </div>

        <p className="form-helper">
          Results are compared as percentages, so any maximum is fine. Declines are only compared within
          the same subject.
        </p>
      </form>
    </Modal>
  );
}
