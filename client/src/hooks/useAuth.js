import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

/** Access the signed-in user and auth actions. Must be used inside <AuthProvider>. */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return context;
}
