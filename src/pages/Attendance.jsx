import React from 'react';

export default function Attendance() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Attendance Monitoring</h2>
          <p className="page-description">
            Track student attendance percentages, chronic absenteeism alerts, and lecture records.
          </p>
        </div>
      </div>

      <div className="placeholder-card">
        <span className="placeholder-badge">Milestone 5 Preview</span>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          Attendance Module Route Ready
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
          This page is wired to the <code>/attendance</code> route. In Milestone 5, we will
          add date range filters, course-wise attendance rosters, and threshold alert flags
          (&lt; 75% warnings and &lt; 65% critical alerts).
        </p>
      </div>
    </div>
  );
}
