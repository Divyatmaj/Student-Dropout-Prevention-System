import React from 'react';
import { Info, CheckCircle2, Clock } from 'lucide-react';

import Badge from '../common/Badge.jsx';
import { formatDate } from '../../utils/formatters.js';

const RISK_COLORS = {
  HIGH: 'var(--color-risk-high)',
  MEDIUM: 'var(--color-risk-medium)',
  LOW: 'var(--color-risk-low)',
  INSUFFICIENT_DATA: 'var(--color-text-muted)',
};

/** Score bar out of 100 with the 25 / 50 category boundaries marked. */
export function RiskScoreBar({ score, category }) {
  if (category === 'INSUFFICIENT_DATA') {
    return <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>No score yet</span>;
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontWeight: 700, fontSize: '15px', color: RISK_COLORS[category], minWidth: '28px' }}>{score}</span>
      <div
        role="img"
        aria-label={`Risk score ${score} out of 100`}
        style={{ position: 'relative', width: '90px', height: '6px', backgroundColor: 'var(--color-bg-muted)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}
      >
        <div style={{ width: `${score}%`, height: '100%', backgroundColor: RISK_COLORS[category] }} />
        {[25, 50].map((mark) => (
          <span key={mark} style={{ position: 'absolute', left: `${mark}%`, top: 0, bottom: 0, width: '1px', backgroundColor: 'var(--color-bg-surface)' }} />
        ))}
      </div>
    </div>
  );
}

/** Review state line: "Reviewed by X on Y" / "Awaiting review". */
export function ReviewStatus({ assessment, compact = false }) {
  if (!assessment || assessment.category === 'LOW') return null;
  if (assessment.needsReview) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--color-accent)' }}>
        <Clock size={13} aria-hidden="true" />
        {assessment.reviewedAt ? 'Changed since last review' : 'Awaiting review'}
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-risk-low)' }}>
      <CheckCircle2 size={13} aria-hidden="true" />
      Reviewed{compact ? '' : ` by ${assessment.reviewedByName} on ${formatDate(assessment.reviewedAt)}`}
    </span>
  );
}

/**
 * Full explanation of a risk assessment: score, category, data status,
 * every contributing reason with its points, data gaps and review note.
 */
export default function RiskExplanation({ assessment }) {
  if (!assessment) return null;
  const { score, category, dataStatus, reasons = [], dataGaps = [], calculatedAt } = assessment;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <Badge type="risk" value={category} />
        <RiskScoreBar score={score} category={category} />
        {dataStatus !== 'COMPLETE' && <Badge type="dataStatus" value={dataStatus} />}
        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
          Calculated {formatDate(calculatedAt)}
        </span>
      </div>

      {reasons.length > 0 ? (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {reasons.map((reason) => (
            <li
              key={reason.code}
              style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13px', padding: '6px 10px', backgroundColor: 'var(--color-bg-muted)', borderRadius: 'var(--radius-sm)' }}
            >
              <span>{reason.label}</span>
              <strong style={{ whiteSpace: 'nowrap' }}>+{reason.points}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {category === 'INSUFFICIENT_DATA'
            ? 'There is not enough attendance or marks data to calculate an indicator yet.'
            : 'No risk rules were triggered by the current records.'}
        </p>
      )}

      {dataGaps.length > 0 && (
        <div className="alert alert-info" style={{ padding: '8px 12px' }}>
          <Info size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span style={{ fontSize: '12px' }}>
            {dataStatus === 'INSUFFICIENT_DATA' ? 'Missing data: ' : 'Provisional — '}
            {dataGaps.join('; ')}. Missing data is never treated as good performance.
          </span>
        </div>
      )}

      {assessment.reviewNote && !assessment.needsReview && (
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', borderLeft: '3px solid var(--color-risk-low)', paddingLeft: '10px', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--color-text-primary)' }}>Review note</strong> ({assessment.reviewedByName},{' '}
          {formatDate(assessment.reviewedAt)}): {assessment.reviewNote}
        </div>
      )}

      <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
        A rule-based indicator to prompt staff review — not a prediction about the student. It must never be
        used for punishment or exclusion.
      </p>
    </div>
  );
}
