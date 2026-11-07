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
  ShieldCheck,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const navLinks = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/students',
      label: 'Students Directory',
      icon: Users,
    },
    {
      to: '/attendance',
      label: 'Attendance',
      icon: CalendarCheck,
    },
    {
      to: '/academics',
      label: 'Academics',
      icon: BookOpen,
    },
    {
      to: '/risk',
      label: 'Risk Monitoring',
      icon: AlertTriangle,
    },
    {
      to: '/interventions',
      label: 'Interventions',
      icon: ClipboardList,
    },
  ];

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
          <div className="user-avatar" title="Dr. Radhika Sharma">
            RS
          </div>
          <div className="user-info">
            <div className="user-name">Dr. Radhika S.</div>
            <div className="user-role">Academic Coordinator</div>
          </div>
          <button
            onClick={() => {
              onClose();
              navigate('/login');
            }}
            title="Sign out to Login"
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
