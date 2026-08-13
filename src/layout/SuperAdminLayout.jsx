import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSuperAdminAuth } from '../superadmin/SuperAdminAuthContext.jsx';
import styles from './DashboardLayout.module.css';

const NAV_ITEMS = [
  { to: '/superadmin', label: 'Tenants', end: true },
  { to: '/superadmin/plans', label: 'Plans' },
];

export function SuperAdminLayout() {
  const { admin, logout } = useSuperAdminAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/superadmin/login', { replace: true });
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>PackStack Admin</div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.account}>
          <span className={styles.accountEmail}>{admin?.email}</span>
          <button type="button" className="btn btn-sm" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
