import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import LoadingState from '../common/LoadingState.jsx';
import EmptyState from '../common/EmptyState.jsx';

/**
 * Guards routes that need a signed-in user.
 * - While the stored session is being verified, shows a loading state.
 * - Signed-out users are sent to /login (and returned here after signing in).
 * - With `permission`, users whose role lacks it see an access-restricted page.
 *
 * Renders `children` if given, otherwise the nested route <Outlet />.
 */
export default function ProtectedRoute({ children, permission }) {
  const { status, can } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingState message="Checking your session..." />
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (permission && !can(permission)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access Restricted"
        message="Your role does not have access to this page. Contact your school administrator if you need it."
      />
    );
  }

  return children ?? <Outlet />;
}
