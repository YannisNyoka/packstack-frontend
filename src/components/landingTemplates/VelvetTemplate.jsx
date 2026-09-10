import { useNavigate, Link } from 'react-router-dom';
import { Footer } from '../Footer.jsx';
import { useHeroMedia } from './useHeroMedia.js';
import { businessNameVisibility } from './businessNameVisibility.js';
import styles from './VelvetTemplate.module.css';

/**
 * Deep jewel-tone register (uses the tenant's own primary color as the
 * background wash, not fixed to black like Luxe/Noir): an inset double-line
 * border framing the hero content like a picture frame, and services as a
 * real two-column table with a header row - Luxe/Heritage's lists never
 * have a header row, this one does.
 */
export function VelvetTemplate({ theme, customer, services }) {
  const navigate = useNavigate();
  const { heroMedia, videoReady, setVideoReady } = useHeroMedia(theme);
  const heroEnabled = theme?.heroEnabled !== false;
  const primaryColor = theme?.colors?.primary || '#4c0519';
  const accentColor = theme?.colors?.accent || '#eab308';
  const { showInNav, showInHero } = businessNameVisibility(theme);
  const activeServices = (services || []).filter((s) => s.active !== false);

  return (
    <div data-testid="landing-template-velvet" className={styles.page} style={{ '--brand': primaryColor, '--accent': accentColor }}>
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
          {heroMedia?.type === 'image' && <img className={styles.heroMedia} src={heroMedia.src} alt="" />}
          <div className={styles.heroOverlay} />
          <div className={styles.heroFrame}>
            {theme?.heroBadgeText && <div className={styles.heroBadge}>{theme.heroBadgeText}</div>}
            {showInHero && <h1 className={styles.heroTitle}>{theme?.businessName}</h1>}
            {theme?.tagline && <p className={styles.heroTagline}>{theme.tagline}</p>}
            <button type="button" className={styles.primaryCta} onClick={() => navigate('/book')}>
              Reserve an Appointment
            </button>
          </div>
        </header>
      )}

      {activeServices.length > 0 && (
        <section className={styles.services}>
          <h2 className={styles.servicesHeading}>Treatments</h2>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>Service</span>
              <span className={styles.headerDuration}>Duration</span>
              <span>Price</span>
            </div>
            {activeServices.map((service) => (
              <div key={service._id} className={styles.tableRow}>
                <span className={styles.serviceName}>{service.name}</span>
                <span className={styles.serviceDuration}>{service.durationMinutes} min</span>
                <span className={styles.servicePrice}>R{service.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer theme={theme} variant="velvet" />
    </div>
  );
}
