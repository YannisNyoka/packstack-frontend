import { useNavigate, Link } from 'react-router-dom';
import { Footer } from '../Footer.jsx';
import { useHeroMedia } from './useHeroMedia.js';
import { businessNameVisibility } from './businessNameVisibility.js';
import styles from './HorizonTemplate.module.css';

/**
 * "Postcard" register: a thin logo-only top strip (no nav links up there -
 * they move into the content band below the image instead), a fixed-height
 * image spanning the full width like a photo, then a centered content band
 * underneath it rather than text overlaid on the photo.
 */
export function HorizonTemplate({ theme, customer, services }) {
  const navigate = useNavigate();
  const { heroMedia, videoReady, setVideoReady } = useHeroMedia(theme);
  const heroEnabled = theme?.heroEnabled !== false;
  const primaryColor = theme?.colors?.primary || '#111827';
  const accentColor = theme?.colors?.accent || primaryColor;
  const { showInNav, showInHero } = businessNameVisibility(theme);
  const activeServices = (services || []).filter((s) => s.active !== false);

  return (
    <div data-testid="landing-template-horizon" className={styles.page} style={{ '--brand': primaryColor, '--accent': accentColor }}>
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          {theme?.logoUrl && <img src={theme.logoUrl} alt="" className={styles.navLogo} />}
          {showInNav && <span>{theme?.businessName}</span>}
        </div>
        <Link to="/book" className={styles.navCta}>
          Book Now
        </Link>
      </nav>

      {heroEnabled && (
        <header>
          <div className={styles.heroImageStrip}>
            {heroMedia?.type === 'video' && (
              <video
                key={heroMedia.src}
                className={`${styles.heroVideo} ${videoReady ? styles.heroVideoReady : ''}`}
                src={heroMedia.src}
                autoPlay
                muted
                loop
                playsInline
                onCanPlay={() => setVideoReady(true)}
              />
            )}
            {heroMedia?.type === 'image' && <img className={styles.heroImage} src={heroMedia.src} alt="" />}
            {!heroMedia && <div className={styles.heroPlaceholder} />}
          </div>
          <div className={styles.heroBand}>
            {theme?.heroBadgeText && <div className={styles.heroBadge}>{theme.heroBadgeText}</div>}
            {showInHero && <h1 className={styles.heroTitle}>{theme?.businessName}</h1>}
            {theme?.tagline && <p className={styles.heroTagline}>{theme.tagline}</p>}
            <div className={styles.heroActions}>
              <button type="button" className={styles.primaryCta} onClick={() => navigate('/book')}>
                Book Appointment
              </button>
              {customer ? (
                <Link to="/account" className={styles.navLink}>
                  My Account
                </Link>
              ) : (
                <Link to="/account/login" className={styles.navLink}>
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </header>
      )}

      {activeServices.length > 0 && (
        <section className={styles.services}>
          <h2 className={styles.servicesHeading}>Services</h2>
          <div className={styles.serviceGrid}>
            {activeServices.map((service) => (
              <div key={service._id} className={styles.serviceCard}>
                <span className={styles.serviceName}>{service.name}</span>
                <span className={styles.serviceMeta}>
                  {service.durationMinutes} min · R{service.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer theme={theme} variant="horizon" />
    </div>
  );
}
