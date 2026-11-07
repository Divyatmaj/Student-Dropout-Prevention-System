import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, LayoutDashboard } from 'lucide-react';
import Button from '../components/common/Button.jsx';

export default function NotFound() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '80px 20px',
        maxWidth: '520px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-primary-subtle)',
          color: 'var(--color-primary)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <HelpCircle size={32} />
      </div>

      <h2
        style={{
          fontSize: '26px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: '8px',
        }}
      >
        Page Not Found
      </h2>

      <p
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: '14px',
          lineHeight: 1.6,
          marginBottom: '24px',
        }}
      >
        The requested institutional route does not exist or has been relocated.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <Link to="/dashboard">
          <Button variant="primary" size="md" icon={LayoutDashboard}>
            Back to Dashboard
          </Button>
        </Link>
        <Link to="/students">
          <Button variant="secondary" size="md">
            Student Directory
          </Button>
        </Link>
      </div>
    </div>
  );
}
