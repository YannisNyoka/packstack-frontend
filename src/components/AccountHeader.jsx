import { Link } from 'react-router-dom';
import styles from './AccountHeader.module.css';

/**
 * Shared branded header bar for every customer-facing page (booking wizard,
 * manage-link page, login/signup, profile) - so a tenant's brand color/logo
 * shows up the same way everywhere a customer lands, not just on the
 * landing page. `right` is an optional slot for a nav action (My Account,
 * Log out, etc). The brand/logo links back to the landing page ("/") from
 * anywhere in the customer-facing app, same as clicking a logo does on
 * pretty much every real website.
 */
export function AccountHeader({ theme, right }) {
  return (
    <div className={styles.bar}>
      <Link to="/" className={styles.brand}>
        {theme?.logoUrl && <img src={theme.logoUrl} alt="" className={styles.logo} />}
        <span className={styles.name}>{theme?.businessName}</span>
      </Link>
      {right && <div className={styles.right}>{right}</div>}
    </div>
  );
}
