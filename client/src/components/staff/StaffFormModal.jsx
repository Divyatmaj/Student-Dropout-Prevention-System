import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import { createStaff, updateStaff } from '../../services/staffService.js';
import { useAuth } from '../../hooks/useAuth.js';
import { ROLE_LABELS } from '../../utils/permissions.js';
import { apiDetailsToFieldErrors } from '../../utils/studentValidation.js';
import { STAFF_ROLES, STAFF_ROLE_HELP, MIN_PASSWORD_LENGTH } from '../../constants/staff.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values, isEdit) {
  const errors = {};
  if (values.name.trim().length < 2) errors.name = 'Enter the full name.';
  if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (!STAFF_ROLES.includes(values.role)) errors.role = 'Choose a role.';
  if (!isEdit && values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return errors;
}

/** Add a staff account (with a temporary password) or edit name, email and role. */
export default function StaffFormModal({ staff = null, onClose, onSaved }) {
  const { user } = useAuth();
  const isEdit = Boolean(staff);
  const isSelf = isEdit && staff.id === user?.id;

  const [values, setValues] = useState({
    name: staff?.name ?? '',
    email: staff?.email ?? '',
    role: staff?.role ?? 'TEACHER',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => {
    const next = { ...values, [field]: e.target.value };
    setValues(next);
    setFormError('');
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: validate(next, isEdit)[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate(values, isEdit);
    setErrors(v);
    if (Object.keys(v).length) {
      setFormError('Please fix the highlighted fields.');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: values.name.trim(), email: values.email.trim().toLowerCase(), role: values.role };
      const saved = isEdit
        ? await updateStaff(staff.id, payload)
        : await createStaff({ ...payload, password: values.password });
      onSaved(saved);
    } catch (err) {
      setErrors((prev) => ({ ...prev, ...apiDetailsToFieldErrors(err.details) }));
      setFormError(err.message || 'Could not save the account.');
      setSaving(false);
    }
  };

  const field = (name) => ({
    id: `staff-${name}`,
    value: values[name],
    onChange: set(name),
    disabled: saving,
    'aria-invalid': errors[name] ? 'true' : 'false',
    'aria-describedby': errors[name] ? `staff-${name}-error` : undefined,
  });
  const error = (name) =>
    errors[name] ? <span id={`staff-${name}-error`} className="form-error">{errors[name]}</span> : null;

  return (
    <Modal
      isOpen
      onClose={saving ? () => {} : onClose}
      title={isEdit ? `Edit ${staff.name}` : 'Add Staff Member'}
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" size="md" type="submit" form="staff-form" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Account'}
          </Button>
        </>
      }
    >
      <form id="staff-form" onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {formError && (
          <div className="alert alert-error" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{formError}</span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="staff-name">Full name *</label>
          <input {...field('name')} className="form-input" type="text" maxLength={100} autoComplete="off" />
          {error('name')}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="staff-email">Email *</label>
          <input {...field('email')} className="form-input" type="email" maxLength={150} autoComplete="off" placeholder="name@school.edu" />
          {error('email')}
          {!error('email') && <span className="form-helper">Used to sign in.</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="staff-role">Role *</label>
          <select {...field('role')} className="form-select" disabled={saving || isSelf}>
            {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          {error('role')}
          {!error('role') && (
            <span className="form-helper">
              {isSelf ? 'You cannot change your own role.' : STAFF_ROLE_HELP[values.role]}
            </span>
          )}
        </div>

        {!isEdit && (
          <div className="form-group">
            <label className="form-label" htmlFor="staff-password">Temporary password *</label>
            <input {...field('password')} className="form-input" type="password" autoComplete="new-password" />
            {error('password')}
            {!error('password') && (
              <span className="form-helper">
                At least {MIN_PASSWORD_LENGTH} characters. Share it with the staff member privately.
              </span>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
