import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — redirects to /login if no valid session exists.
 * Preserves the attempted URL so login can redirect back after success.
 */
export function ProtectedRoute({ children, allowed_roles }) {
  const { is_authenticated, user } = useAuth();
  const location = useLocation();

  if (!is_authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowed_roles && user && !allowed_roles.includes(user.role)) {
    // Wrong role — send to their own dashboard root rather than /login
    return <Navigate to="/" replace />;
  }

  return children;
}
