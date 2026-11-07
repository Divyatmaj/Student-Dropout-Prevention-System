import React from 'react';
import { Layers } from 'lucide-react';
import Button from './Button.jsx';

export default function EmptyState({
  title = 'No Records Found',
  message = 'There are currently no records matching this criteria.',
  icon: Icon = Layers,
  actionLabel,
  onAction,
}) {
  return (
    <div className="state-container">
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
      >
        <Icon size={24} />
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
