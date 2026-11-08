import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button.jsx';

export default function ErrorState({
  title = 'Unable to Load Dashboard Data',
  message = 'There was an issue communicating with the institutional backend API. Please check your connection or retry.',
  onRetry,
}) {
  return (
    <div className="state-container">
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-risk-high-subtle)',
          color: 'var(--color-risk-high)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AlertTriangle size={24} />
      </div>

      <h3 className="state-title" style={{ color: 'var(--color-risk-high)' }}>
        {title}
      </h3>

      <p className="state-description">{message}</p>

      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          icon={RefreshCw}
          style={{ marginTop: '8px' }}
        >
          Retry Request
        </Button>
      )}
    </div>
  );
}
