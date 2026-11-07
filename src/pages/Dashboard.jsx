import React from 'react';

export default function Dashboard() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Executive Dashboard</h2>
          <p className="page-description">
            Overall institutional retention metrics, risk distributions, and urgent alerts.
          </p>
        </div>
      </div>

      <div className="placeholder-card">
        <span className="placeholder-badge">Milestone 3 Preview</span>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          Dashboard Overview Route Ready
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
          This page is wired to the <code>/dashboard</code> route. In Milestone 3, we will
          add top statistic metric cards, rule-based risk distributions, urgent student attention
          tables, and recent interventions.
        </p>
      </div>
    </div>
  );
}
