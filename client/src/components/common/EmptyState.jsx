import React from 'react';
import { Layers } from 'lucide-react';
import Button from './Button.jsx';

export default function EmptyState({
  title = 'No Records Found',
  message = 'There are currently no records matching this criteria.',
  icon: Icon = Layers,
  actionLabel,
  onAction,
  className = '',
  style = {},
}) {
  return (
    <div
      className={`state-container ${className}`.trim()}
      style={style}
      role="status"
      aria-live="polite"
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-bg-muted)',
          color: 'var(--color-text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-hidden="true"
      >
        <Icon size={24} aria-hidden="true" />
      </div>

      <h3 className="state-title">{title}</h3>
      <p className="state-description">{message}</p>

      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction} style={{ marginTop: '8px' }}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
