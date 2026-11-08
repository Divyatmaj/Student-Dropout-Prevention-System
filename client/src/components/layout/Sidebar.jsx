import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  CalendarCheck,
  BookOpen,
  AlertTriangle,
  ClipboardList,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { PERMISSIONS, ROLE_LABELS } from '../../utils/permissions.js';
import { getInitials } from '../../utils/formatters.js';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, logout, can } = useAuth();

  const navLinks = [
    {
      to: '/dashboard',
      permission: PERMISSIONS.DASHBOARD_VIEW,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/students',
      permission: PERMISSIONS.STUDENTS_VIEW,
      label: 'Students Directory',
      icon: Users,
    },
    {
      to: '/attendance',
      permission: PERMISSIONS.ATTENDANCE_VIEW,
      label: 'Attendance',
      icon: CalendarCheck,
    },
    {
      to: '/academics',
      permission: PERMISSIONS.ACADEMICS_VIEW,
      label: 'Academics',
      icon: BookOpen,
    },
    {
      to: '/risk',
      permission: PERMISSIONS.RISK_VIEW,
      label: 'Risk Monitoring',
      icon: AlertTriangle,
    },
    {
      to: '/interventions',
      permission: PERMISSIONS.INTERVENTIONS_VIEW,
      label: 'Interventions',
      icon: ClipboardList,
    },
  ].filter((item) => can(item.permission));

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo-icon">
            <GraduationCap size={22} />
          </div>
          <div>
            <h1 className="sidebar-brand-title">Udaan</h1>
            <span className="sidebar-brand-subtitle">Retention Portal</span>
          </div>
        </div>
        <button
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close navigation sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <span className="nav-section-label">Main Navigation</span>
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Icon size={18} className="nav-icon" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Institutional User Profile & Sign Out */}
      <div className="sidebar-footer">
        <div className="user-profile-badge">
          <div className="user-avatar" title={user?.name}>
            {getInitials(user?.name)}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{ROLE_LABELS[user?.role] || user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
