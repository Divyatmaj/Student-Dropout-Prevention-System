import React from 'react';

export default function RiskMonitoring() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Risk Monitoring</h2>
          <p className="page-description">
            Explainable rule-based student categorization across High, Medium, and Low risk thresholds.
          </p>
        </div>
      </div>

      <div className="placeholder-card">
        <span className="placeholder-badge">Milestone 7 Preview</span>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          Risk Categorization Route Ready
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
          This page is wired to the <code>/risk</code> route. In Milestone 7, we will
          show rule-based risk triggers, breakdown charts for High, Medium, and Low risk cohorts,
          and transparent reasons behind why each student is flagged (no black-box AI).
        </p>
      </div>
    </div>
  );
}
