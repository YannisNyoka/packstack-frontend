import { Navigate } from 'react-router-dom';
import { useSuperAdminAuth } from './SuperAdminAuthContext.jsx';

export function RequireSuperAdmin({ children }) {
  const { admin, booting } = useSuperAdminAuth();

  if (booting) return null;
  if (!admin) return <Navigate to="/superadmin/login" replace />;

  return children;
}
