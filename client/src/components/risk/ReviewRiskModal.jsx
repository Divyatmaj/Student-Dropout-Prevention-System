import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import RiskExplanation from './RiskExplanation.jsx';
import { markRiskReviewed } from '../../services/riskService.js';

/** Mark a student's current risk flag as reviewed, with a context note. */
export default function ReviewRiskModal({ assessment, studentName, onClose, onReviewed }) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (note.trim().length < 10) {
      setError('Add a short review note (at least 10 characters).');
      return;
    }
    setSaving(true);
    setError('');
    try {
      onReviewed(await markRiskReviewed(assessment.studentId, note.trim()));
    } catch (err) {
      setError(err.message || 'Could not save the review.');
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={saving ? () => {} : onClose}
      title={`Review flag — ${studentName}`}
      footer={
        <>
          <Button variant="secondary" size="md" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" size="md" type="submit" form="review-risk-form" disabled={saving}>
            {saving ? 'Saving...' : 'Mark as Reviewed'}
          </Button>
        </>
      }
    >
      <form id="review-risk-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div className="alert alert-error" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}

        <RiskExplanation assessment={{ ...assessment, reviewNote: null }} />

        <div className="form-group">
          <label className="form-label" htmlFor="review-note">Review note *</label>
          <textarea
            id="review-note"
            className="form-input"
            rows={3}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={saving}
            placeholder="What did you check or learn? e.g. Spoke with the guardian; absences were due to illness, now recovered."
          />
          <span className="form-helper">
            Records that a person looked at this flag. If support is needed, create an intervention too.
          </span>
        </div>
      </form>
    </Modal>
  );
}
