import { useNavigate, Link } from 'react-router-dom';
import { Footer } from '../Footer.jsx';
import { businessNameVisibility } from './businessNameVisibility.js';
import styles from './NoirTemplate.module.css';

/**
 * Stark high-contrast premium-grooming register: pure black throughout (not
 * just the hero, unlike Luxe), a left-aligned oversized sans headline
 * instead of Luxe's centered italic serif, an optional thin vertical image
 * strip down the right edge instead of a full-bleed photo, and services as
 * a tight two-column monospace-leaning list.
 */
export function NoirTemplate({ theme, customer, services }) {
  const navigate = useNavigate();
  const heroEnabled = theme?.heroEnabled !== false;
  const primaryColor = theme?.colors?.primary || '#111827';
  const accentColor = theme?.colors?.accent || '#e5e5e5';
  const { showInNav, showInHero } = businessNameVisibility(theme);
  const activeServices = (services || []).filter((s) => s.active !== false);

  return (
    <div data-testid="landing-template-noir" className={styles.page} style={{ '--brand': primaryColor, '--accent': accentColor }}>
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          {theme?.logoUrl && <img src={theme.logoUrl} alt="" className={styles.navLogo} />}
          {showInNav && <span>{theme?.businessName}</span>}
        </div>
        <div className={styles.navLinks}>
          {customer ? (
            <Link to="/account" className={styles.navLink}>
              Account
            </Link>
          ) : (
            <Link to="/account/login" className={styles.navLink}>
              Sign in
            </Link>
          )}
          <Link to="/book" className={styles.navCta}>
            Book
          </Link>
        </div>
      </nav>

      {heroEnabled && (
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            {theme?.heroBadgeText && <div className={styles.heroBadge}>{theme.heroBadgeText}</div>}
            {showInHero && <h1 className={styles.heroTitle}>{theme?.businessName}</h1>}
            {theme?.tagline && <p className={styles.heroTagline}>{theme.tagline}</p>}
            <button type="button" className={styles.primaryCta} onClick={() => navigate('/book')}>
              Book Appointment
            </button>
          </div>
          {theme?.bannerUrl && (
            <div className={styles.heroStrip}>
              <img src={theme.bannerUrl} alt="" />
            </div>
          )}
        </header>
      )}

      {activeServices.length > 0 && (
        <section className={styles.services}>
          <h2 className={styles.servicesHeading}>Services</h2>
          <div className={styles.serviceList}>
            {activeServices.map((service) => (
              <div key={service._id} className={styles.serviceRow}>
                <span className={styles.serviceName}>{service.name}</span>
                <span className={styles.serviceMeta}>
                  {service.durationMinutes}m / R{service.price.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer theme={theme} variant="noir" />
    </div>
  );
}
