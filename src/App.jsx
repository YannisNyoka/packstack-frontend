import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import { RequireAuth } from './auth/RequireAuth.jsx';
import { DashboardLayout } from './layout/DashboardLayout.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { BillingSuccessPage } from './pages/BillingSuccessPage.jsx';
import { BillingCancelledPage } from './pages/BillingCancelledPage.jsx';
import { AppointmentsPage } from './pages/AppointmentsPage.jsx';
import { StaffPage } from './pages/StaffPage.jsx';
import { ServicesPage } from './pages/ServicesPage.jsx';
import { CustomersPage } from './pages/CustomersPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { BookingPage } from './pages/BookingPage.jsx';
import { ManagePage } from './pages/ManagePage.jsx';
import { SuperAdminAuthProvider } from './superadmin/SuperAdminAuthContext.jsx';
import { RequireSuperAdmin } from './superadmin/RequireSuperAdmin.jsx';
import { SuperAdminLayout } from './layout/SuperAdminLayout.jsx';
import { SuperAdminLoginPage } from './pages/SuperAdminLoginPage.jsx';
import { TenantsPage } from './pages/superadmin/TenantsPage.jsx';
import { PlansPage } from './pages/superadmin/PlansPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<BookingPage />} />
          <Route path="/manage" element={<ManagePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/billing/success" element={<BillingSuccessPage />} />
          <Route path="/billing/cancelled" element={<BillingCancelledPage />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            }
          >
            <Route index element={<AppointmentsPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route
            element={
              <SuperAdminAuthProvider>
                <Outlet />
              </SuperAdminAuthProvider>
            }
          >
            <Route path="/superadmin/login" element={<SuperAdminLoginPage />} />
            <Route
              path="/superadmin"
              element={
                <RequireSuperAdmin>
                  <SuperAdminLayout />
                </RequireSuperAdmin>
              }
            >
              <Route index element={<TenantsPage />} />
              <Route path="plans" element={<PlansPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
