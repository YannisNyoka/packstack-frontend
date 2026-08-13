import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export function RequireAuth({ children, ownerOnly = false }) {
  const { user, booting } = useAuth();
  const location = useLocation();

  if (booting) return null; // avoid a login-page flash while the silent refresh is still in flight

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (ownerOnly && user.role !== 'owner') return <Navigate to="/dashboard" replace />;

  return children;
}
