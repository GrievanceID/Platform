import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ROLE_HOME = {
  citizen:  '/grievances/mine',
  reviewer: '/reviewer/queue',
  employee: '/employee/dashboard',
  admin:    '/admin/dashboard',
};

/**
 * ProtectedRoute — redirects to /login if no valid session exists.
 * Preserves the attempted URL in state.from so login can redirect back.
 *
 * allowed_roles: string[]  — if provided, users with a non-matching role are
 * redirected to their own role's home page rather than /login, so they land
 * somewhere meaningful rather than a blank or broken page.
 */
export function ProtectedRoute({ children, allowed_roles }) {
  const { is_authenticated, user } = useAuth();
  const location = useLocation();

  if (!is_authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowed_roles && user && !allowed_roles.includes(user.role)) {
    const home = ROLE_HOME[user.role] ?? '/';
    return <Navigate to={home} replace />;
  }

  return children;
}
