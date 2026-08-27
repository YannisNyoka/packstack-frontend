import { useNavigate, Link } from 'react-router-dom';
import { Footer } from '../Footer.jsx';
import styles from './BoldTemplate.module.css';

/**
 * High-energy color-block hero using the tenant's own accent color as a
 * solid background (not just a photo overlay) - deliberately doesn't use
 * useHeroMedia's rotating video carousel, since a hero video would compete
 * with the point of this template (the color itself is the statement).
 * A banner image, if set, still shows as a smaller accent panel.
 */
export function BoldTemplate({ theme, customer, services }) {
  const navigate = useNavigate();
  const heroEnabled = theme?.heroEnabled !== false;
  const primaryColor = theme?.colors?.primary || '#111827';
  const accentColor = theme?.colors?.accent || '#d946ef';
  const activeServices = (services || []).filter((s) => s.active !== false);

  return (
    // --brand drives both the nav CTA and the Footer background here - for
    // this template that's deliberately the loud accent color, not the
    // (usually darker/neutral) primary, so the footer matches the hero's
    // color-block energy rather than reverting to a muted tone.
    <div data-testid="landing-template-bold" className={styles.page} style={{ '--brand': accentColor, '--primary': primaryColor }}>
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          {theme?.logoUrl && <img src={theme.logoUrl} alt="" className={styles.navLogo} />}
          <span>{theme?.businessName}</span>
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
          <div className={styles.heroContent}>
            {theme?.heroBadgeText && <div className={styles.heroBadge}>{theme.heroBadgeText}</div>}
            <h1 className={styles.heroTitle}>{theme?.businessName}</h1>
            {theme?.tagline && <p className={styles.heroTagline}>{theme.tagline}</p>}
            <button type="button" className={styles.primaryCta} onClick={() => navigate('/book')}>
              Book Appointment →
            </button>
          </div>
          {theme?.bannerUrl && (
            <div className={styles.heroImagePanel}>
              <img src={theme.bannerUrl} alt="" className={styles.heroImage} />
            </div>
          )}
        </header>
      )}

      <div className={styles.divider} />

      {activeServices.length > 0 && (
        <section className={styles.services}>
          <h2 className={styles.servicesHeading}>What We Do</h2>
          <div className={styles.serviceGrid}>
            {activeServices.map((service, i) => (
              <div key={service._id} className={styles.serviceCard} data-alt={i % 2 === 1}>
                {service.imageUrl && <img src={service.imageUrl} alt="" className={styles.serviceImage} />}
                <span className={styles.serviceName}>{service.name}</span>
                <span className={styles.serviceMeta}>
                  {service.durationMinutes} min · R{service.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer theme={theme} variant="bold" />
    </div>
  );
}
