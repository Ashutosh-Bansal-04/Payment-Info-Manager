import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — wraps route elements that require authentication.
 *
 * How it works:
 * 1. If auth is still rehydrating (loading), render nothing to avoid a flash
 *    of the login page before localStorage is read.
 * 2. If no token exists, redirect to /login and preserve the intended
 *    destination in location state so we can redirect back after login.
 * 3. If `adminOnly` is true and the user's role isn't "admin", redirect to
 *    the main payments page (or you could show a 403 page).
 * 4. Otherwise, render the children normally.
 *
 * NOTE: This is a *client-side* UX guard only. The real security lives in the
 * backend's JWT verification (protect middleware) and role check (adminOnly
 * middleware). Even if someone bypasses this component, the API will still
 * reject unauthorised requests with 401/403.
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null; // or a loading spinner
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/payments" replace />;
  }

  return children;
}
