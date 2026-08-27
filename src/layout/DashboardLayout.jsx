import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import * as themeApi from '../api/theme.js';
import { getTenantSlug } from '../api/tenant.js';
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
  {
    label: 'Settings',
    ownerOnly: true,
    children: [
      { to: '/dashboard/settings/branding', label: 'Branding' },
      { to: '/dashboard/settings/integrations', label: 'Integrations' },
      { to: '/dashboard/settings/booking-access', label: 'Booking access' },
      { to: '/dashboard/settings/deposits', label: 'Deposits' },
      { to: '/dashboard/settings/billing', label: 'Billing' },
      { to: '/dashboard/settings/domains', label: 'Custom domains' },
    ],
  },
];

/** The tenant's own public booking page - always the plain subdomain, even
 * once a custom domain is connected, since that always works with no DNS
 * dependency. Mirrors the URL OnboardingChecklist already builds. */
function liveSiteUrl(slug) {
  const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'packstack.co.za';
  return `https://${slug}.${baseDomain}/`;
}

function LiveLinkButton() {
  const [copied, setCopied] = useState(false);
  const url = liveSiteUrl(getTenantSlug());

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied (permissions, insecure context) -
      // the link is still right there to select/copy manually below.
    }
  }

  return (
    <div className={styles.liveLink}>
      <div className={styles.liveLinkHeader}>
        <span className={styles.liveLinkDot} aria-hidden="true" />
        Your live booking page
      </div>
      <a href={url} target="_blank" rel="noreferrer" className={styles.liveLinkUrl}>
        {url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
      </a>
      <div className={styles.liveLinkActions}>
        <button type="button" className={styles.liveLinkBtn} onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <a href={url} target="_blank" rel="noreferrer" className={styles.liveLinkBtn}>
          Open →
        </a>
      </div>
    </div>
  );
}

function SidebarNav({ isOwner, onNavigate }) {
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(location.pathname.startsWith('/dashboard/settings'));

  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.filter((item) => !item.ownerOnly || isOwner).map((item) => {
        if (!item.children) {
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              onClick={onNavigate}
            >
              {item.label}
            </NavLink>
          );
        }

        const groupActive = location.pathname.startsWith('/dashboard/settings');
        return (
          <div key={item.label}>
            <button
              type="button"
              className={`${styles.navLink} ${styles.navGroup} ${groupActive ? styles.navLinkActive : ''}`}
              onClick={() => setSettingsOpen((open) => !open)}
              aria-expanded={settingsOpen}
            >
              {item.label}
              <span className={`${styles.chevron} ${settingsOpen ? styles.chevronOpen : ''}`} aria-hidden="true">
                ›
              </span>
            </button>
            {settingsOpen && (
              <div className={styles.subNav}>
                {item.children.map((child) => (
                  <NavLink
                    key={child.to}
                    to={child.to}
                    className={({ isActive }) => `${styles.subNavLink} ${isActive ? styles.subNavLinkActive : ''}`}
                    onClick={onNavigate}
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(null);
  const isOwner = user?.role === 'owner';
  const banner = STATUS_BANNER[user?.tenantStatus] || trialBanner(user?.tenantStatus, user?.trialEndsAt);

  useEffect(() => {
    themeApi.getTheme().then(setTheme).catch(() => {});
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const businessName = theme?.businessName || 'PackStack';

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
        <span className={styles.mobileBrand}>{businessName}</span>
      </header>

      {menuOpen && <div className={styles.backdrop} onClick={() => setMenuOpen(false)} />}

      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          {theme?.logoUrl && <img src={theme.logoUrl} alt="" className={styles.brandLogo} />}
          <div>
            <div className={styles.brandName}>{businessName}</div>
            <div className={styles.brandSubtitle}>Admin panel</div>
          </div>
        </div>

        <LiveLinkButton />

        <SidebarNav isOwner={isOwner} onNavigate={() => setMenuOpen(false)} />

        <div className={styles.account}>
          <span className={styles.accountEmail}>{user?.email}</span>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            Log out
          </button>
          <Link to="/" className={styles.poweredBy}>
            Powered by PackStack
          </Link>
        </div>
      </aside>
      <main className={styles.main}>
        {banner && (
          <div className={`${styles.banner} ${styles[`banner-${banner.tone}`]}`}>
            <span>{banner.message}</span>
            {isOwner && <Link to="/dashboard/settings/billing">Manage billing</Link>}
          </div>
        )}
        <OnboardingChecklist />
        <Outlet />
      </main>
    </div>
  );
}
