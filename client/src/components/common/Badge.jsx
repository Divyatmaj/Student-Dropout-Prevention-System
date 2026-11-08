import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, XCircle, FileText, HelpCircle } from 'lucide-react';
import { STUDENT_STATUS_LABELS } from '../../constants/students.js';

export default function Badge({ type = 'risk', value, children }) {
  const normalized = (value || children || '').toString().toLowerCase().replace(/\s+/g, '_');

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
    } else if (normalized === 'insufficient_data') {
      icon = <HelpCircle size={12} />;
      label = 'Insufficient Data';
    }

    return (
      <span className={`badge badge-risk-${normalized}`}>
        {icon}
        <span>{label}</span>
      </span>
    );
  }

  if (type === 'attendance') {
    let icon = null;
    let label = value || children;

    if (normalized === 'present') {
      icon = <CheckCircle2 size={12} />;
      label = 'Present';
    } else if (normalized === 'absent') {
      icon = <XCircle size={12} />;
      label = 'Absent';
    } else if (normalized === 'late') {
      icon = <Clock size={12} />;
      label = 'Late';
    } else if (normalized === 'excused') {
      icon = <FileText size={12} />;
      label = 'Excused';
    }

    return (
      <span className={`badge badge-attendance-${normalized}`}>
        {icon}
        <span>{label}</span>
      </span>
    );
  }

  if (type === 'studentStatus') {
    return (
      <span className={`badge badge-student-${normalized}`}>
        {STUDENT_STATUS_LABELS[(value || '').toUpperCase()] || value}
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

  if (type === 'result' || type === 'assessment') {
    const isPass = normalized === 'pass';
    return (
      <span className={`badge ${isPass ? 'badge-risk-low' : 'badge-risk-high'}`}>
        {isPass ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
        <span>{isPass ? 'Pass' : 'Fail'}</span>
      </span>
    );
  }

  if (type === 'difficulty') {
    let diffClass = 'badge-risk-low';
    if (normalized === 'high') diffClass = 'badge-risk-high';
    if (normalized === 'moderate') diffClass = 'badge-risk-medium';

    return (
      <span className={`badge ${diffClass}`}>
        <span>{children || value}</span>
      </span>
    );
  }

  return <span className="badge">{children || value}</span>;
}
