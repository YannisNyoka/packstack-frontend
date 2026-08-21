import { Navigate, useLocation } from 'react-router-dom';
import { useCustomerAuth } from './CustomerAuthContext.jsx';

export function RequireCustomerAuth({ children }) {
  const { customer, booting } = useCustomerAuth();
  const location = useLocation();

  if (booting) return null; // avoid a login-page flash while the silent refresh is still in flight

  if (!customer) return <Navigate to="/account/login" replace state={{ from: location }} />;

  return children;
}
