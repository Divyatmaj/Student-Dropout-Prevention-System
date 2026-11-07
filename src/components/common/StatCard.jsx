import React from 'react';

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'var(--color-primary)',
  iconBg = 'var(--color-primary-subtle)',
  badgeText,
  badgeType = 'default',
  subtitle,
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        <div
          className="stat-card-icon-wrapper"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          {Icon && <Icon size={20} />}
        </div>
      </div>

      <div>
        <div className="stat-card-value">{value}</div>
      </div>

      <div className="stat-card-footer">
        {badgeText && (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor:
                badgeType === 'high'
                  ? 'var(--color-risk-high-subtle)'
                  : badgeType === 'medium'
                  ? 'var(--color-risk-medium-subtle)'
                  : badgeType === 'low'
                  ? 'var(--color-risk-low-subtle)'
                  : 'var(--color-bg-muted)',
              color:
                badgeType === 'high'
                  ? 'var(--color-risk-high)'
                  : badgeType === 'medium'
                  ? 'var(--color-risk-medium)'
                  : badgeType === 'low'
                  ? 'var(--color-risk-low)'
                  : 'var(--color-text-secondary)',
            }}
          >
            {badgeText}
          </span>
        )}
        {subtitle && <span>{subtitle}</span>}
      </div>
    </div>
  );
}
