import { useEffect, useState } from 'react';
import * as bookingApi from '../api/publicBooking.js';
import { ApiError } from '../api/client.js';
import { LandingPreview } from '../components/LandingPreview.jsx';
import { useCustomerAuth } from '../auth/CustomerAuthContext.jsx';
import { useTenantDocumentHead } from '../hooks/useTenantDocumentHead.js';
import { useTenantSEO } from '../hooks/useTenantSEO.js';
import styles from './LandingPage.module.css';

export function LandingPage() {
  const { customer } = useCustomerAuth();
  const [theme, setTheme] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    bookingApi
      .getTheme()
      .then(setTheme)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'This page is unavailable right now.'))
      .finally(() => setLoading(false));
  }, []);

  // Only for useTenantSEO's structured data (hasOfferCatalog) - not part of
  // the loading gate above, since JSON-LD populating a moment after first
  // paint is fine for a crawler but a blocked spinner for real visitors isn't.
  useEffect(() => {
    bookingApi.listServices().then(setServices).catch(() => {});
  }, []);

  useTenantDocumentHead({ businessName: theme?.businessName, logoUrl: theme?.logoUrl, faviconUrl: theme?.faviconUrl, themeColor: theme?.colors?.primary });
  useTenantSEO({ theme, services, path: '' });

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
