import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { validateScore, toPercentage } from '@udaan/shared';

import Modal, { ModalCloseButton } from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import LoadingState from '../common/LoadingState.jsx';
import ErrorState from '../common/ErrorState.jsx';
import { getAssessment, saveMarks } from '../../services/academicService.js';
import { useAuth } from '../../hooks/useAuth.js';
import { PERMISSIONS } from '../../utils/permissions.js';
import { formatClass, formatDate, formatPercent } from '../../utils/formatters.js';
import { focusFirstInvalidField } from '../../utils/formAccessibility.js';

/**
 * Enter or correct marks for every student in an assessment's class.
 * Blank scores are simply not saved (a missing mark is not a zero).
 */
export default function MarksSheetModal({ assessmentId, onClose, onSaved }) {
  const { can } = useAuth();
  const canEdit = can(PERMISSIONS.MARKS_RECORD);

  const [data, setData] = useState(null);
  const [scores, setScores] = useState({}); // studentId → string
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await getAssessment(assessmentId);
      setData(result);
      setScores(
        Object.fromEntries(result.students.map(({ student, mark }) => [student.id, mark ? String(mark.score) : '']))
      );
    } catch (err) {
      setLoadError(err.message || 'Could not load this assessment.');
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const assessment = data?.assessment;
  const rows = data?.students ?? [];

  const changed = rows.filter(({ student, mark }) => {
    const value = (scores[student.id] ?? '').trim();
    if (value === '') return false; // blank = not recorded (existing marks can't be blanked here)
    return !mark || Number(value) !== mark.score;
  });

  const errors = Object.fromEntries(
    rows
      .map(({ student }) => {
        const value = (scores[student.id] ?? '').trim();
        if (value === '' || !assessment) return null;
        const message = validateScore(value, assessment.maxMarks);
        return message ? [student.id, message] : null;
      })
      .filter(Boolean)
  );
  const hasErrors = Object.keys(errors).length > 0;

  const handleSave = async () => {
    if (hasErrors) {
      setSaveError('Fix the highlighted scores before saving.');
      focusFirstInvalidField();
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const result = await saveMarks(
        assessmentId,
        changed.map(({ student }) => ({ studentId: student.id, score: Number(scores[student.id]) }))
      );
      onSaved(result, assessment);
    } catch (err) {
      setSaveError(err.message || 'Could not save marks.');
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      size="lg"
      onClose={onClose}
      closeDisabled={saving}
      hasUnsavedChanges={canEdit && changed.length > 0}
      title={assessment ? `${assessment.subject} · ${assessment.title}` : 'Marks'}
      footer={
        <>
          {saveError && (
            <span className="form-error" role="alert" style={{ marginRight: 'auto', display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
              <AlertCircle size={13} /> {saveError}
            </span>
          )}
          <ModalCloseButton variant="secondary" size="md" disabled={saving}>
            {canEdit ? 'Cancel' : 'Close'}
          </ModalCloseButton>
          {canEdit && (
            <Button variant="primary" size="md" onClick={handleSave} disabled={saving || changed.length === 0}>
              {saving ? 'Saving...' : changed.length ? `Save ${changed.length} mark${changed.length === 1 ? '' : 's'}` : 'No changes'}
            </Button>
          )}
        </>
      }
    >
      {loading && <LoadingState message="Loading marks sheet..." />}
      {!loading && loadError && <ErrorState title="Unable to Load Marks" message={loadError} onRetry={load} />}

      {!loading && !loadError && assessment && (
        <>
          <div style={{ display: 'flex', gap: '8px 16px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            <span><strong>Class:</strong> {formatClass(assessment.grade, assessment.section)}</span>
            <span><strong>Date:</strong> {formatDate(assessment.assessmentDate)}</span>
            <span><strong>Out of:</strong> {assessment.maxMarks}</span>
            <span><strong>Recorded:</strong> {assessment.marksCount}/{assessment.classSize}</span>
          </div>

          {rows.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '16px' }}>
              There are no active students in this class.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th style={{ width: '160px' }}>Score / {assessment.maxMarks}</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ student, mark }) => {
                    const value = scores[student.id] ?? '';
                    const pct = value.trim() !== '' && !errors[student.id] ? toPercentage(Number(value), assessment.maxMarks) : null;
                    const isChanged = changed.some((c) => c.student.id === student.id);
                    return (
                      <tr key={student.id} style={isChanged ? { backgroundColor: '#fffbeb' } : undefined}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{student.fullName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            {student.studentCode}
                            {student.status !== 'ACTIVE' && ' · no longer enrolled'}
                            {isChanged && <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}> · unsaved</span>}
                          </div>
                        </td>
                        <td>
                          <input
                            className="form-input"
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max={assessment.maxMarks}
                            step="0.5"
                            value={value}
                            placeholder="—"
                            disabled={!canEdit || saving}
                            aria-label={`Score for ${student.fullName}`}
                            aria-invalid={errors[student.id] ? 'true' : 'false'}
                            aria-describedby={errors[student.id] ? `mark-error-${student.id}` : undefined}
                            onChange={(e) => {
                              setSaveError('');
                              setScores((prev) => ({ ...prev, [student.id]: e.target.value }));
                            }}
                            style={{ width: '110px', padding: '6px 10px' }}
                          />
                          {errors[student.id] && <div id={`mark-error-${student.id}`} className="form-error" role="alert" style={{ marginTop: '4px' }}>{errors[student.id]}</div>}
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatPercent(pct)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="form-helper">
            Leave a score blank if the student hasn't sat the assessment — blank is not counted as zero.
            Saving updates each student's risk indicator.
          </p>
        </>
      )}
    </Modal>
  );
}
