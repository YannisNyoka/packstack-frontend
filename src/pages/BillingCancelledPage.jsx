import { useNavigate } from 'react-router-dom';
import styles from './BillingStatusPage.module.css';

export function BillingCancelledPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.wrap}>
      <div className={`card ${styles.card}`}>
        <div className={`${styles.icon} ${styles.iconNeutral}`}>!</div>
        <h1 className={styles.title}>Checkout cancelled</h1>
        <p className={styles.body}>
          No card was added, but your salon and free trial are still active. You can pick a plan and subscribe
          anytime from Settings → Billing once you're logged in.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/login')}>
          Log in to your dashboard
        </button>
      </div>
    </div>
  );
}
