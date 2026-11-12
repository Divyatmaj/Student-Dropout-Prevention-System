import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

const routeTitleMap = {
  '/dashboard': 'Overview',
  '/students': 'Students',
  '/attendance': 'Attendance',
  '/academics': 'Academic Performance',
  '/risk': 'Risk Monitoring & Indicators',
  '/interventions': 'Interventions',
  '/staff': 'Staff Accounts',
};

export default function Navbar({ onToggleSidebar }) {
  const location = useLocation();
  const { user } = useAuth();

  // Find the matching title or default to Udaan Platform
  const currentTitle =
    routeTitleMap[location.pathname] ||
    (location.pathname.startsWith('/students/') ? 'Student Profile & Details' : 'Udaan Portal');

  // Name the browser tab after the current page; restore the default on sign-out.
  useEffect(() => {
    const defaultTitle = document.title;
    document.title = `${currentTitle} · Udaan`;
    return () => {
      document.title = defaultTitle;
    };
  }, [currentTitle]);

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
          <span>{user?.schoolName}</span>
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
