import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function StudentDetail() {
  const { id } = useParams();

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Link
          to="/students"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: 'var(--color-primary)',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} /> Back to Students Directory
        </Link>
      </div>

      <div className="page-header">
        <div>
          <h2 className="page-title">Student Profile: {id}</h2>
          <p className="page-description">
            Individual student academic metrics, attendance breakdown, and risk analysis.
          </p>
        </div>
      </div>

      <div className="placeholder-card">
        <span className="placeholder-badge">Dynamic Parameter Route</span>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          Viewing Profile for ID: <code>{id}</code>
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
          This page is wired to the <code>/students/:id</code> route using React Router&apos;s
          <code>useParams()</code> hook. In Milestone 4, this page will present complete
          student records, risk rationale, attendance graphs, and intervention histories.
        </p>
      </div>
    </div>
  );
}
