import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, XCircle, FileText, HelpCircle } from 'lucide-react';
import { STUDENT_STATUS_LABELS } from '../../constants/students.js';
import { DATA_STATUS_LABELS } from '../../constants/risk.js';
import { INTERVENTION_STATUS_LABELS, INTERVENTION_PRIORITY_LABELS } from '../../constants/interventions.js';

export default function Badge({ type = 'risk', value, children, className = '', style = {} }) {
  const normalized = (value || children || '').toString().toLowerCase().replace(/\s+/g, '_');
  const baseClass = (extra) => `badge ${extra} ${className}`.trim();

  if (type === 'risk') {
    let icon = null;
    let label = value || children;

    if (normalized === 'high') {
      icon = <AlertTriangle size={12} aria-hidden="true" />;
      label = 'High Risk';
    } else if (normalized === 'medium') {
      icon = <Clock size={12} aria-hidden="true" />;
      label = 'Medium Risk';
    } else if (normalized === 'low') {
      icon = <CheckCircle2 size={12} aria-hidden="true" />;
      label = 'Low Risk';
    } else if (normalized === 'insufficient_data') {
      icon = <HelpCircle size={12} aria-hidden="true" />;
      label = 'Insufficient Data';
    }

    return (
      <span className={baseClass(`badge-risk-${normalized}`)} style={style}>
        {icon}
        <span>{label}</span>
      </span>
    );
  }

  if (type === 'attendance') {
    let icon = null;
    let label = value || children;

    if (normalized === 'present') {
      icon = <CheckCircle2 size={12} aria-hidden="true" />;
      label = 'Present';
    } else if (normalized === 'absent') {
      icon = <XCircle size={12} aria-hidden="true" />;
      label = 'Absent';
    } else if (normalized === 'late') {
      icon = <Clock size={12} aria-hidden="true" />;
      label = 'Late';
    } else if (normalized === 'excused') {
      icon = <FileText size={12} aria-hidden="true" />;
      label = 'Excused';
    }

    return (
      <span className={baseClass(`badge-attendance-${normalized}`)} style={style}>
        {icon}
        <span>{label}</span>
      </span>
    );
  }

  if (type === 'dataStatus') {
    return (
      <span className={baseClass(`badge-data-${normalized}`)} title="How complete the data behind this score is" style={style}>
        {DATA_STATUS_LABELS[(value || '').toUpperCase()] || value}
      </span>
    );
  }

  if (type === 'studentStatus') {
    return (
      <span className={baseClass(`badge-student-${normalized}`)} style={style}>
        {STUDENT_STATUS_LABELS[(value || '').toUpperCase()] || value}
      </span>
    );
  }

  // Intervention status: OPEN | IN_PROGRESS | COMPLETED | CANCELLED
  if (type === 'status') {
    return (
      <span className={baseClass(`badge-status-${normalized}`)} style={style}>
        {children || INTERVENTION_STATUS_LABELS[(value || '').toUpperCase()] || value}
      </span>
    );
  }

  // Intervention priority: LOW | MEDIUM | HIGH
  if (type === 'priority') {
    return (
      <span className={baseClass(`badge-priority-${normalized}`)} style={style}>
        {children || `${INTERVENTION_PRIORITY_LABELS[(value || '').toUpperCase()] || value} priority`}
      </span>
    );
  }

  if (type === 'overdue') {
    return (
      <span className={baseClass('badge-overdue')} style={style}>
        <AlertTriangle size={12} aria-hidden="true" />
        <span>{children || 'Overdue'}</span>
      </span>
    );
  }

  if (type === 'result' || type === 'assessment') {
    const isPass = normalized === 'pass';
    return (
      <span className={baseClass(isPass ? 'badge-risk-low' : 'badge-risk-high')} style={style}>
        {isPass ? <CheckCircle2 size={12} aria-hidden="true" /> : <XCircle size={12} aria-hidden="true" />}
        <span>{isPass ? 'Pass' : 'Fail'}</span>
      </span>
    );
  }

  if (type === 'difficulty') {
    let diffClass = 'badge-risk-low';
    if (normalized === 'high') diffClass = 'badge-risk-high';
    if (normalized === 'moderate') diffClass = 'badge-risk-medium';

    return (
      <span className={baseClass(diffClass)} style={style}>
        <span>{children || value}</span>
      </span>
    );
  }

  return <span className={baseClass('')} style={style}>{children || value}</span>;
}
