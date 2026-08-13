import { useNavigate } from 'react-router-dom';
import styles from './BillingStatusPage.module.css';

export function BillingSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.wrap}>
      <div className={`card ${styles.card}`}>
        <div className={`${styles.icon} ${styles.iconSuccess}`}>✓</div>
        <h1 className={styles.title}>You're all set!</h1>
        <p className={styles.body}>
          Your card is on file and your 30-day free trial has started. You won't be charged until the trial ends,
          and you can cancel anytime before then from your dashboard.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/login')}>
          Log in to get started
        </button>
      </div>
    </div>
  );
}
