import styles from './AccountHeader.module.css';

/**
 * Shared branded header bar for every customer-facing page (booking wizard,
 * manage-link page, login/signup, profile) - so a tenant's brand color/logo
 * shows up the same way everywhere a customer lands, not just on the
 * landing page. `right` is an optional slot for a nav action (My Account,
 * Log out, etc).
 */
export function AccountHeader({ theme, right }) {
  return (
    <div className={styles.bar}>
      <div className={styles.brand}>
        {theme?.logoUrl && <img src={theme.logoUrl} alt="" className={styles.logo} />}
        <span className={styles.name}>{theme?.businessName}</span>
      </div>
      {right && <div className={styles.right}>{right}</div>}
    </div>
  );
}
