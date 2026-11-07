import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function Badge({ type = 'risk', value, children }) {
  const normalized = (value || children || '').toString().toLowerCase().replace(' ', '_');

  if (type === 'risk') {
    let icon = null;
    let label = value || children;

    if (normalized === 'high') {
      icon = <AlertTriangle size={12} />;
      label = 'High Risk';
    } else if (normalized === 'medium') {
      icon = <Clock size={12} />;
      label = 'Medium Risk';
    } else if (normalized === 'low') {
      icon = <CheckCircle2 size={12} />;
      label = 'Low Risk';
    }

    return (
      <span className={`badge badge-risk-${normalized}`}>
        {icon}
        <span>{label}</span>
      </span>
    );
  }

  if (type === 'status') {
    return (
      <span className={`badge badge-status-${normalized}`}>
        {children || value}
      </span>
    );
  }

  if (type === 'priority') {
    return (
      <span className={`badge badge-priority-${normalized}`}>
        {children || value}
      </span>
    );
  }

  return <span className="badge">{children || value}</span>;
}
