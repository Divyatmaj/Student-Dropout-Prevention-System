import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, Calendar, ShieldCheck } from 'lucide-react';

const routeTitleMap = {
  '/dashboard': 'Executive Overview',
  '/students': 'Student Directory',
  '/attendance': 'Attendance Records',
  '/academics': 'Academic Performance',
  '/risk': 'Risk Monitoring & Indicators',
  '/interventions': 'Intervention Management',
};

export default function Navbar({ onToggleSidebar }) {
  const location = useLocation();

  // Find the matching title or default to Udaan Platform
  const currentTitle =
    routeTitleMap[location.pathname] ||
    (location.pathname.startsWith('/students/') ? 'Student Profile & Details' : 'Udaan Portal');

  return (
    <header className="navbar">
      {/* Left side: Hamburger Toggle & Current View Title */}
      <div className="navbar-left">
        <button
          className="menu-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
        <div className="navbar-context-title">
          <span>{currentTitle}</span>
        </div>
      </div>

      {/* Right side: Academic Context & User Controls */}
      <div className="navbar-right">
        <div className="institution-pill">
          <span className="institution-pill-dot" />
          <span>AY 2025-26 • Semester I</span>
        </div>

        <button
          className="icon-button"
          aria-label="Institutional notifications"
          title="Notifications"
        >
          <Bell size={18} />
          <span className="notification-dot" />
        </button>
      </div>
    </header>
  );
}
