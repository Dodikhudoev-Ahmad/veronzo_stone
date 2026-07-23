import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { AdminLoader } from './AdminLoader';

// Gate for every /admin/* route except /admin/login. Authorization itself is
// enforced server-side (JWT + role check on each API call) — this only
// decides which UI to show, per the redirect contract: unauthenticated visits
// to any protected route bounce to /admin/login.
export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AdminLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
