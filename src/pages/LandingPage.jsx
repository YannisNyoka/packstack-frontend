import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as bookingApi from '../api/publicBooking.js';
import { ApiError } from '../api/client.js';
import { Footer } from '../components/Footer.jsx';
import { useCustomerAuth } from '../auth/CustomerAuthContext.jsx';
import styles from './LandingPage.module.css';

export function LandingPage() {
  const { customer } = useCustomerAuth();
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const navigate = useNavigate();

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

  const primaryColor = theme?.colors?.primary || '#111827';
  const accentColor = theme?.colors?.accent || primaryColor;
  const heroEnabled = theme?.heroEnabled !== false;
  const heroMedia =
    theme?.heroMediaType === 'video' && theme?.heroVideoUrl
      ? { type: 'video', src: theme.heroVideoUrl }
      : theme?.bannerUrl
        ? { type: 'image', src: theme.bannerUrl }
        : null;

  return (
    <div
      className={styles.page}
      style={{ '--brand': primaryColor, '--color-primary': primaryColor, '--color-accent': accentColor }}
    >
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          {theme?.logoUrl && <img src={theme.logoUrl} alt="" className={styles.navLogo} />}
          <span>{theme?.businessName}</span>
        </div>
        <div className={styles.navLinks}>
          <Link to={customer ? '/account' : '/account/login'} className={styles.navLink}>
            {customer ? 'My Account' : 'Log in'}
          </Link>
          <Link to="/book" className={styles.navCta}>
            Book Now
          </Link>
        </div>
      </nav>

      {heroEnabled ? (
        <header className={styles.hero}>
          {heroMedia?.type === 'video' && (
            <video className={styles.heroMedia} src={heroMedia.src} autoPlay muted loop playsInline />
          )}
          {heroMedia?.type === 'image' && <img className={styles.heroMedia} src={heroMedia.src} alt="" />}
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            {theme?.heroBadgeText && <div className={styles.heroBadge}>{theme.heroBadgeText}</div>}
            <h1 className={styles.heroTitle}>{theme?.businessName}</h1>
            {theme?.tagline && <p className={styles.heroTagline}>{theme.tagline}</p>}
            <button type="button" className={styles.primaryCta} onClick={() => navigate('/book')}>
              Book Appointment
            </button>
          </div>
        </header>
      ) : (
        <header className={styles.simpleHeader}>
          {theme?.logoUrl && <img src={theme.logoUrl} alt="" className={styles.simpleLogo} />}
          <h1>{theme?.businessName}</h1>
          {theme?.tagline && <p className="muted">{theme.tagline}</p>}
          <button type="button" className={styles.primaryCta} onClick={() => navigate('/book')}>
            Book Appointment
          </button>
        </header>
      )}

      <Footer theme={theme} />
    </div>
  );
}
