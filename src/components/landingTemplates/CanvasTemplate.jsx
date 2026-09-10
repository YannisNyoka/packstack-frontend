import { useNavigate, Link } from 'react-router-dom';
import { Footer } from '../Footer.jsx';
import { businessNameVisibility } from './businessNameVisibility.js';
import styles from './CanvasTemplate.module.css';

/**
 * Art-gallery/creative-studio register: mostly empty cream negative space
 * with a small square photo tile pinned to one corner instead of a
 * full-bleed or framed hero image, ultra-thin display type, and services as
 * a horizontally-scrolling row of cards - the only template that scrolls
 * sideways rather than stacking into a grid or list.
 */
export function CanvasTemplate({ theme, customer, services }) {
  const navigate = useNavigate();
  const heroEnabled = theme?.heroEnabled !== false;
  const primaryColor = theme?.colors?.primary || '#111827';
  const accentColor = theme?.colors?.accent || primaryColor;
  const { showInNav, showInHero } = businessNameVisibility(theme);
  const activeServices = (services || []).filter((s) => s.active !== false);

  return (
    <div data-testid="landing-template-canvas" className={styles.page} style={{ '--brand': primaryColor, '--accent': accentColor }}>
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
          {theme?.bannerUrl && (
            <div className={styles.heroTile}>
              <img src={theme.bannerUrl} alt="" />
            </div>
          )}
          <div className={styles.heroContent}>
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
          <div className={styles.serviceScroll}>
            {activeServices.map((service) => (
              <div key={service._id} className={styles.serviceCard}>
                {service.imageUrl ? (
                  <img src={service.imageUrl} alt="" className={styles.serviceImage} />
                ) : (
                  <div className={styles.serviceImagePlaceholder} />
                )}
                <span className={styles.serviceName}>{service.name}</span>
                <span className={styles.serviceMeta}>
                  {service.durationMinutes} min · R{service.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer theme={theme} variant="canvas" />
    </div>
  );
}
