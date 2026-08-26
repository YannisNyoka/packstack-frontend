import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as servicesApi from '../api/services.js';
import * as staffApi from '../api/staff.js';
import * as integrationsApi from '../api/integrations.js';
import { getTenantSlug } from '../api/tenant.js';
import styles from './OnboardingChecklist.module.css';

const DISMISS_KEY_PREFIX = 'packstack_onboarding_dismissed_';

/**
 * Shown above the dashboard until a tenant has at least one service and one
 * staff member (the minimum for the public booking page to show anything) -
 * then flips to a one-time "share your booking link" card. Dismissal is
 * per-tenant, stored in localStorage rather than the backend since it's
 * purely a "don't nag me" preference, not data anyone else needs to see.
 */
export function OnboardingChecklist() {
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(true);

  const slug = getTenantSlug();
  const dismissKey = `${DISMISS_KEY_PREFIX}${slug}`;

  useEffect(() => {
    setDismissed(localStorage.getItem(dismissKey) === '1');
    let cancelled = false;
    Promise.all([servicesApi.listServices(), staffApi.listStaff(), integrationsApi.listIntegrations()])
      .then(([services, staff, integrations]) => {
        if (cancelled) return;
        const connectedProviders = new Set(integrations.map((i) => i.provider));
        setStatus({
          hasService: services.length > 0,
          hasStaff: staff.length > 0,
          hasConfirmationChannel: connectedProviders.has('wati') || connectedProviders.has('resend'),
        });
      })
      .catch(() => {
        // Can't tell what's set up - fail open rather than nag on an error.
        if (!cancelled) setDismissed(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissKey]);

  function dismiss() {
    localStorage.setItem(dismissKey, '1');
    setDismissed(true);
  }

  if (dismissed || !status) return null;

  const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'packstack.co.za';
  const bookingUrl = `https://${slug}.${baseDomain}/`;

  if (status.hasService && status.hasStaff && !status.hasConfirmationChannel) {
    return (
      <div className={`${styles.card} ${styles.warning}`}>
        <p className={styles.text}>
          <strong>Bookings won't be confirmed to customers yet.</strong> You're set up to take
          bookings, but no WhatsApp or Email is connected - customers currently get no
          confirmation message.{' '}
          <Link to="/dashboard/settings">Connect one in Settings →</Link>
        </p>
        <button type="button" className="btn btn-sm" onClick={dismiss}>
          Dismiss
        </button>
      </div>
    );
  }

  if (status.hasService && status.hasStaff) {
    return (
      <div className={styles.card}>
        <p className={styles.text}>
          <strong>You're ready to take bookings.</strong> Share your booking page with customers:{' '}
          <a href={bookingUrl} target="_blank" rel="noreferrer">
            {bookingUrl}
          </a>
        </p>
        <button type="button" className="btn btn-sm" onClick={dismiss}>
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <strong>Getting started</strong>
        <button type="button" className={styles.close} onClick={dismiss} aria-label="Dismiss">
          ×
        </button>
      </div>
      <ul className={styles.list}>
        <li className={status.hasService ? styles.done : ''}>
          <span className={styles.check}>{status.hasService ? '✓' : ''}</span>
          <span className={styles.itemLabel}>Add your first service</span>
          {!status.hasService && <Link to="/dashboard/services">Add now →</Link>}
        </li>
        <li className={status.hasStaff ? styles.done : ''}>
          <span className={styles.check}>{status.hasStaff ? '✓' : ''}</span>
          <span className={styles.itemLabel}>Add a staff member</span>
          {!status.hasStaff && <Link to="/dashboard/staff">Add now →</Link>}
        </li>
      </ul>
    </div>
  );
}
