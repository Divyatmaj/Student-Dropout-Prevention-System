import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService.js';
import { tokenStorage, UNAUTHORIZED_EVENT } from '../services/api.js';
import { can as canUser } from '../utils/permissions.js';

export const AuthContext = createContext(null);

/**
 * Holds the signed-in staff member and exposes login / logout / can().
 *
 * status: 'loading'          — a stored token is being verified via /auth/me
 *         'authenticated'    — `user` is set
 *         'unauthenticated'  — no valid session
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() => (tokenStorage.get() ? 'loading' : 'unauthenticated'));

  // Restore the session from a stored token on first load.
  useEffect(() => {
    if (status !== 'loading') return undefined;
    let cancelled = false;

    authService
      .getCurrentUser()
      .then((currentUser) => {
        if (cancelled) return;
        setUser(currentUser);
        setStatus('authenticated');
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401) tokenStorage.clear();
        setUser(null);
        setStatus('unauthenticated');
      });

    return () => {
      cancelled = true;
    };
    // Run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Any API call that returns 401 signs the user out.
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setStatus('unauthenticated');
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: signedInUser } = await authService.login(email, password);
    tokenStorage.set(token);
    setUser(signedInUser);
    setStatus('authenticated');
    return signedInUser;
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      login,
      logout,
      can: (permission) => canUser(user, permission),
    }),
    [user, status, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
