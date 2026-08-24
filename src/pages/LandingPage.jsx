import { useEffect, useState } from 'react';
import * as bookingApi from '../api/publicBooking.js';
import { ApiError } from '../api/client.js';
import { LandingPreview } from '../components/LandingPreview.jsx';
import { useCustomerAuth } from '../auth/CustomerAuthContext.jsx';
import styles from './LandingPage.module.css';

export function LandingPage() {
  const { customer } = useCustomerAuth();
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    bookingApi
      .getTheme()
      .then(setTheme)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'This page is unavailable right now.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.loading}>
        <p className="error-text">{loadError}</p>
      </div>
    );
  }

  return <LandingPreview theme={theme} customer={customer} />;
}
