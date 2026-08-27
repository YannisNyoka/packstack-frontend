import { useNavigate, Link } from 'react-router-dom';
import { Footer } from '../Footer.jsx';
import { useHeroMedia } from './useHeroMedia.js';
import styles from './ModernTemplate.module.css';

/**
 * Solid sticky nav (not transparent-over-hero like Classic), a split-screen
 * hero (copy one side, media the other), and a services grid below it -
 * services are only shown here for tenants with at least one, and only
 * cards that have a photo get an image (see Service.imageUrl, added
 * alongside this template work).
 */
export function ModernTemplate({ theme, customer, services }) {
  const navigate = useNavigate();
  const { heroMedia, videoReady, setVideoReady } = useHeroMedia(theme);
  const heroEnabled = theme?.heroEnabled !== false;
  const primaryColor = theme?.colors?.primary || '#111827';
  const accentColor = theme?.colors?.accent || primaryColor;
  const activeServices = (services || []).filter((s) => s.active !== false);

  return (
    <div data-testid="landing-template-modern" className={styles.page} style={{ '--brand': primaryColor, '--accent': accentColor }}>
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
            <>
              <Link to="/account/login" className={styles.navLink}>
                Sign in
              </Link>
              <Link to="/account/signup" className={styles.navLink}>
                Sign up
              </Link>
            </>
          )}
          <Link to="/book" className={styles.navCta}>
            Book Now
          </Link>
        </div>
      </nav>

      {heroEnabled && (
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            {theme?.heroBadgeText && <div className={styles.heroBadge}>{theme.heroBadgeText}</div>}
            <h1 className={styles.heroTitle}>{theme?.businessName}</h1>
            {theme?.tagline && <p className={styles.heroTagline}>{theme.tagline}</p>}
            <button type="button" className={styles.primaryCta} onClick={() => navigate('/book')}>
              Book Appointment
            </button>
          </div>
          <div className={styles.heroMediaBox}>
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
        </header>
      )}

      {activeServices.length > 0 && (
        <section className={styles.services}>
          <h2 className={styles.servicesHeading}>Our Services</h2>
          <div className={styles.serviceGrid}>
            {activeServices.map((service) => (
              <div key={service._id} className={styles.serviceCard}>
                {service.imageUrl ? (
                  <img src={service.imageUrl} alt="" className={styles.serviceImage} />
                ) : (
                  <div className={styles.serviceImagePlaceholder} />
                )}
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

      <Footer theme={theme} variant="modern" />
    </div>
  );
}
