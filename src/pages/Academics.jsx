import React from 'react';

export default function Academics() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Academic Performance</h2>
          <p className="page-description">
            Assessment scores, GPA trajectories, and subject-level difficulty breakdowns.
          </p>
        </div>
      </div>

      <div className="placeholder-card">
        <span className="placeholder-badge">Milestone 6 Preview</span>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          Academics Module Route Ready
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
          This page is wired to the <code>/academics</code> route. In Milestone 6, we will
          add internal assessment tables, mid-term evaluation trackers, and subject failure warning lists.
        </p>
      </div>
    </div>
  );
}
