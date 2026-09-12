import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/toast/ToastContext.jsx';
import { ConfirmProvider } from './components/confirm/ConfirmContext.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import { RequireAuth } from './auth/RequireAuth.jsx';
import { DashboardLayout } from './layout/DashboardLayout.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { StaffAcceptInvitePage } from './pages/StaffAcceptInvitePage.jsx';
import { BillingSuccessPage } from './pages/BillingSuccessPage.jsx';
import { BillingCancelledPage } from './pages/BillingCancelledPage.jsx';
import { AppointmentsPage } from './pages/AppointmentsPage.jsx';
import { SchedulePage } from './pages/SchedulePage.jsx';
import { OverviewPage } from './pages/OverviewPage.jsx';
import { StaffPage } from './pages/StaffPage.jsx';
import { ServicesPage } from './pages/ServicesPage.jsx';
import { CustomersPage } from './pages/CustomersPage.jsx';
import { BookingPage } from './pages/BookingPage.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { ManagePage } from './pages/ManagePage.jsx';
import { PreviewFramePage } from './pages/PreviewFramePage.jsx';
import { SuperAdminAuthProvider } from './superadmin/SuperAdminAuthContext.jsx';
import { RequireSuperAdmin } from './superadmin/RequireSuperAdmin.jsx';
import { SuperAdminLayout } from './layout/SuperAdminLayout.jsx';
import { SuperAdminLoginPage } from './pages/SuperAdminLoginPage.jsx';
import { CustomerAuthProvider } from './auth/CustomerAuthContext.jsx';
import { RequireCustomerAuth } from './auth/RequireCustomerAuth.jsx';
import { CustomerLoginPage } from './pages/account/CustomerLoginPage.jsx';
import { CustomerSignupPage } from './pages/account/CustomerSignupPage.jsx';
import { CustomerProfilePage } from './pages/account/CustomerProfilePage.jsx';
import { ForgotPasswordPage } from './pages/account/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from './pages/account/ResetPasswordPage.jsx';

// Lazy: Analytics pulls in the recharts charting library (only page that
// does), and Settings/the whole superadmin console are low-traffic surfaces
// (owner-only, single-superadmin respectively) - nobody else should have to
// download any of this just to load the dashboard or a tenant's booking page.
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx').then((m) => ({ default: m.AnalyticsPage })));
const SettingsLayout = lazy(() => import('./pages/settings/SettingsLayout.jsx').then((m) => ({ default: m.SettingsLayout })));
const BrandingSettingsPage = lazy(() =>
  import('./pages/settings/BrandingSettingsPage.jsx').then((m) => ({ default: m.BrandingSettingsPage }))
);
const IntegrationsSettingsPage = lazy(() =>
  import('./pages/settings/IntegrationsSettingsPage.jsx').then((m) => ({ default: m.IntegrationsSettingsPage }))
);
const BookingAccessSettingsPage = lazy(() =>
  import('./pages/settings/BookingAccessSettingsPage.jsx').then((m) => ({ default: m.BookingAccessSettingsPage }))
);
const DepositSettingsPage = lazy(() =>
  import('./pages/settings/DepositSettingsPage.jsx').then((m) => ({ default: m.DepositSettingsPage }))
);
const BillingSettingsPage = lazy(() =>
  import('./pages/settings/BillingSettingsPage.jsx').then((m) => ({ default: m.BillingSettingsPage }))
);
const DomainsSettingsPage = lazy(() =>
  import('./pages/settings/DomainsSettingsPage.jsx').then((m) => ({ default: m.DomainsSettingsPage }))
);
const SuperAdminOverviewPage = lazy(() =>
  import('./pages/superadmin/OverviewPage.jsx').then((m) => ({ default: m.OverviewPage }))
);
const TenantsPage = lazy(() => import('./pages/superadmin/TenantsPage.jsx').then((m) => ({ default: m.TenantsPage })));
const TenantDetailPage = lazy(() =>
  import('./pages/superadmin/TenantDetailPage.jsx').then((m) => ({ default: m.TenantDetailPage }))
);
const PlansPage = lazy(() => import('./pages/superadmin/PlansPage.jsx').then((m) => ({ default: m.PlansPage })));

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <BrowserRouter>
          <AuthProvider>
            {/* Global, like AuthProvider - so any customer-facing page (landing,
                booking wizard) can tell whether a customer is already logged in,
                not just the /account/* routes. */}
            <CustomerAuthProvider>
              <Suspense fallback={null}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  {/* Not wrapped in RequireCustomerAuth - whether an account is
                      required to book is a per-tenant setting now
                      (bookingRules.requireCustomerAccount), so BookingPage.jsx
                      checks it itself and self-redirects to login when needed. */}
                  <Route path="/book" element={<BookingPage />} />
                  <Route path="/manage" element={<ManagePage />} />
                  {/* Loaded only inside an <iframe> by BrandingSettingsPage.jsx's
                      live preview (see DevicePreview / PreviewFramePage.jsx) - a
                      real browsing context is what makes the phone preview
                      actually simulate a phone's viewport instead of just a
                      scaled-down desktop render. */}
                  <Route path="/preview" element={<PreviewFramePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/staff/accept-invite" element={<StaffAcceptInvitePage />} />
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
                    <Route index element={<OverviewPage />} />
                    <Route path="appointments" element={<AppointmentsPage />} />
                    <Route path="schedule" element={<SchedulePage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="staff" element={<StaffPage />} />
                    <Route path="services" element={<ServicesPage />} />
                    <Route path="customers" element={<CustomersPage />} />
                    <Route
                      path="settings"
                      element={
                        <RequireAuth ownerOnly>
                          <SettingsLayout />
                        </RequireAuth>
                      }
                    >
                      <Route index element={<Navigate to="branding" replace />} />
                      <Route path="branding" element={<BrandingSettingsPage />} />
                      <Route path="integrations" element={<IntegrationsSettingsPage />} />
                      <Route path="booking-access" element={<BookingAccessSettingsPage />} />
                      <Route path="deposits" element={<DepositSettingsPage />} />
                      <Route path="billing" element={<BillingSettingsPage />} />
                      <Route path="domains" element={<DomainsSettingsPage />} />
                    </Route>
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
                      <Route index element={<SuperAdminOverviewPage />} />
                      <Route path="tenants" element={<TenantsPage />} />
                      <Route path="tenants/:id" element={<TenantDetailPage />} />
                      <Route path="plans" element={<PlansPage />} />
                    </Route>
                  </Route>

                  <Route path="/account/login" element={<CustomerLoginPage />} />
                  <Route path="/account/signup" element={<CustomerSignupPage />} />
                  <Route path="/account/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/account/reset-password" element={<ResetPasswordPage />} />
                  <Route
                    path="/account"
                    element={
                      <RequireCustomerAuth>
                        <CustomerProfilePage />
                      </RequireCustomerAuth>
                    }
                  />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </CustomerAuthProvider>
          </AuthProvider>
        </BrowserRouter>
      </ConfirmProvider>
    </ToastProvider>
  );
}
