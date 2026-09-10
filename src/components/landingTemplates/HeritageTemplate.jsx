import { useNavigate, Link } from 'react-router-dom';
import { Footer } from '../Footer.jsx';
import { useHeroMedia } from './useHeroMedia.js';
import { businessNameVisibility } from './businessNameVisibility.js';
import styles from './HeritageTemplate.module.css';

/**
 * Warm, classic barbershop/heritage-salon register: cream background, a
 * circular emblem framing the business name like a badge/crest, warm serif
 * display type, and services presented as a framed "menu card" (rules above
 * and below the whole list, like a printed price list) rather than a grid.
 */
export function HeritageTemplate({ theme, customer, services }) {
  const navigate = useNavigate();
  const { heroMedia, videoReady, setVideoReady } = useHeroMedia(theme);
  const heroEnabled = theme?.heroEnabled !== false;
  const primaryColor = theme?.colors?.primary || '#7c2d12';
  const accentColor = theme?.colors?.accent || '#b45309';
  const { showInNav, showInHero } = businessNameVisibility(theme);
  const activeServices = (services || []).filter((s) => s.active !== false);

  return (
    <div data-testid="landing-template-heritage" className={styles.page} style={{ '--brand': primaryColor, '--accent': accentColor }}>
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
          {heroMedia && <div className={styles.heroOverlay} />}
          <div className={styles.heroContent}>
            <div className={styles.heroEmblem}>
              {theme?.heroBadgeText ? <span>{theme.heroBadgeText}</span> : <span>Est.</span>}
            </div>
            {showInHero && <h1 className={styles.heroTitle}>{theme?.businessName}</h1>}
            {theme?.tagline && <p className={styles.heroTagline}>{theme.tagline}</p>}
            <button type="button" className={styles.primaryCta} onClick={() => navigate('/book')}>
              Book an Appointment
            </button>
          </div>
        </header>
      )}

      {activeServices.length > 0 && (
        <section className={styles.services}>
          <h2 className={styles.servicesHeading}>The Menu</h2>
          <div className={styles.menuCard}>
            {activeServices.map((service) => (
              <div key={service._id} className={styles.serviceRow}>
                <span className={styles.serviceName}>{service.name}</span>
                <span className={styles.serviceDots} />
                <span className={styles.serviceMeta}>
                  {service.durationMinutes} min · R{service.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer theme={theme} variant="heritage" />
    </div>
  );
}
