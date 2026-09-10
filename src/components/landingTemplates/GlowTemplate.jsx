import { useNavigate, Link } from 'react-router-dom';
import { Footer } from '../Footer.jsx';
import { businessNameVisibility } from './businessNameVisibility.js';
import styles from './GlowTemplate.module.css';

/**
 * Bright wellness/skincare register: no photo required to look finished -
 * the hero is a soft primary-to-accent gradient with blurred color-blob
 * decoration, centered content, and a circular framed banner image if one's
 * set (a portrait/product shot, not a full-bleed background). Services show
 * as cards with a colored initial-letter avatar instead of a photo, so this
 * still looks complete for a tenant who hasn't uploaded service images yet.
 */
export function GlowTemplate({ theme, customer, services }) {
  const navigate = useNavigate();
  const heroEnabled = theme?.heroEnabled !== false;
  const primaryColor = theme?.colors?.primary || '#111827';
  const accentColor = theme?.colors?.accent || '#a78bfa';
  const { showInNav, showInHero } = businessNameVisibility(theme);
  const activeServices = (services || []).filter((s) => s.active !== false);

  return (
    <div data-testid="landing-template-glow" className={styles.page} style={{ '--brand': primaryColor, '--accent': accentColor }}>
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          {theme?.logoUrl && <img src={theme.logoUrl} alt="" className={styles.navLogo} />}
          {showInNav && <span>{theme?.businessName}</span>}
        </div>
        <div className={styles.navLinks}>
          {customer ? (
            <Link to="/account" className={styles.navLink}>
              My Account
            </Link>
          ) : (
            <Link to="/account/login" className={styles.navLink}>
              Sign in
            </Link>
          )}
          <Link to="/book" className={styles.navCta}>
            Book Now
          </Link>
        </div>
      </nav>

      {heroEnabled && (
        <header className={styles.hero}>
          <div className={styles.heroBlobOne} />
          <div className={styles.heroBlobTwo} />
          <div className={styles.heroContent}>
            {theme?.bannerUrl && (
              <div className={styles.heroPortrait}>
                <img src={theme.bannerUrl} alt="" />
              </div>
            )}
            {theme?.heroBadgeText && <div className={styles.heroBadge}>{theme.heroBadgeText}</div>}
            {showInHero && <h1 className={styles.heroTitle}>{theme?.businessName}</h1>}
            {theme?.tagline && <p className={styles.heroTagline}>{theme.tagline}</p>}
            <button type="button" className={styles.primaryCta} onClick={() => navigate('/book')}>
              Book Appointment
            </button>
          </div>
        </header>
      )}

      {activeServices.length > 0 && (
        <section className={styles.services}>
          <h2 className={styles.servicesHeading}>Services</h2>
          <div className={styles.serviceGrid}>
            {activeServices.map((service) => (
              <div key={service._id} className={styles.serviceCard}>
                <div className={styles.serviceAvatar}>{service.name.charAt(0).toUpperCase()}</div>
                <div className={styles.serviceCardBody}>
                  <span className={styles.serviceName}>{service.name}</span>
                  <span className={styles.serviceMeta}>
                    {service.durationMinutes} min · R{service.price.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer theme={theme} variant="glow" />
    </div>
  );
}
