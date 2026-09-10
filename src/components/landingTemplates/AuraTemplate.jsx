import { useNavigate, Link } from 'react-router-dom';
import { Footer } from '../Footer.jsx';
import { businessNameVisibility } from './businessNameVisibility.js';
import styles from './AuraTemplate.module.css';

/**
 * A floating pill-shaped nav (not a full-width bar) centered over a
 * spotlight hero: a soft radial glow behind a circular framed portrait, the
 * opposite mechanic from Glow's two large corner blobs. Services show as
 * cards with a glowing ring around a circular number instead of a square
 * avatar or plain index.
 */
export function AuraTemplate({ theme, customer, services }) {
  const navigate = useNavigate();
  const heroEnabled = theme?.heroEnabled !== false;
  const primaryColor = theme?.colors?.primary || '#111827';
  const accentColor = theme?.colors?.accent || '#818cf8';
  const { showInNav, showInHero } = businessNameVisibility(theme);
  const activeServices = (services || []).filter((s) => s.active !== false);

  return (
    <div data-testid="landing-template-aura" className={styles.page} style={{ '--brand': primaryColor, '--accent': accentColor }}>
      <div className={styles.navWrap}>
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
      </div>

      {heroEnabled && (
        <header className={styles.hero}>
          <div className={styles.heroGlow} />
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
            {activeServices.map((service, i) => (
              <div key={service._id} className={styles.serviceCard}>
                <div className={styles.serviceRing}>{i + 1}</div>
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

      <Footer theme={theme} variant="aura" />
    </div>
  );
}
