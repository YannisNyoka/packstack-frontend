import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { OnboardingChecklist } from '../components/OnboardingChecklist.jsx';
import styles from './DashboardLayout.module.css';

const STATUS_BANNER = {
  past_due: {
    tone: 'warning',
    message: 'Your subscription payment is past due.',
  },
  suspended: {
    tone: 'danger',
    message: 'Your account is suspended - the dashboard is read-only until your subscription is reactivated.',
  },
};

export function trialBanner(tenantStatus, trialEndsAt) {
  if (tenantStatus !== 'trial' || !trialEndsAt) return null;
  const daysLeft = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (daysLeft <= 0) {
    return { tone: 'danger', message: "Your free trial has ended - subscribe to keep your booking page live." };
  }
  const tone = daysLeft <= 7 ? 'warning' : 'neutral';
  const dayWord = daysLeft === 1 ? 'day' : 'days';
  return { tone, message: `${daysLeft} ${dayWord} left in your free trial.` };
}

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', end: true },
  { to: '/dashboard/appointments', label: 'Appointments' },
  { to: '/dashboard/analytics', label: 'Analytics' },
  { to: '/dashboard/customers', label: 'Customers' },
  { to: '/dashboard/staff', label: 'Staff' },
  { to: '/dashboard/services', label: 'Services' },
  { to: '/dashboard/settings', label: 'Settings', ownerOnly: true },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isOwner = user?.role === 'owner';
  const banner = STATUS_BANNER[user?.tenantStatus] || trialBanner(user?.tenantStatus, user?.trialEndsAt);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={styles.shell}>
      <header className={styles.mobileBar}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <span />
          <span />
          <span />
        </button>
        <span className={styles.mobileBrand}>PackStack</span>
      </header>

      {menuOpen && <div className={styles.backdrop} onClick={() => setMenuOpen(false)} />}

      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>PackStack</div>
        <nav className={styles.nav}>
          {NAV_ITEMS.filter((item) => !item.ownerOnly || isOwner).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.account}>
          <span className={styles.accountEmail}>{user?.email}</span>
          <button type="button" className="btn btn-sm" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>
      <main className={styles.main}>
        {banner && (
          <div className={`${styles.banner} ${styles[`banner-${banner.tone}`]}`}>
            <span>{banner.message}</span>
            {isOwner && <Link to="/dashboard/settings">Manage billing</Link>}
          </div>
        )}
        <OnboardingChecklist />
        <Outlet />
      </main>
    </div>
  );
}
