import React from 'react';
import { Link } from 'react-router-dom';

export default function Students() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Students Directory</h2>
          <p className="page-description">
            Complete student cohort with searchable records, department filters, and risk indicators.
          </p>
        </div>
      </div>

      <div className="placeholder-card">
        <span className="placeholder-badge">Milestone 4 Preview</span>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          Students Directory Route Ready
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>
          This page is wired to the <code>/students</code> route. In Milestone 4, we will
          add student search, filters, pagination, and direct links to individual student profiles.
        </p>

        <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-bg-muted)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Sample Route Link:{' '}
          </span>
          <Link
            to="/students/STU-2024-001"
            style={{
              color: 'var(--color-primary)',
              fontWeight: 600,
              fontSize: '13px',
              textDecoration: 'underline',
            }}
          >
            View Sample Student Profile (STU-2024-001) →
          </Link>
        </div>
      </div>
    </div>
  );
}
