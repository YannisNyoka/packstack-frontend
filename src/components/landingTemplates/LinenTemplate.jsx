import { useNavigate, Link } from 'react-router-dom';
import { Footer } from '../Footer.jsx';
import { useHeroMedia } from './useHeroMedia.js';
import { businessNameVisibility } from './businessNameVisibility.js';
import styles from './LinenTemplate.module.css';

/**
 * Warm-neutral register, softer than Minimal's stark white: a centered
 * hero like Elegant/Luxe, but followed by a feature strip band (small
 * bullet points - hours, walk-ins, parking, whatever the tagline doesn't
 * cover) between the hero and services - a section type no other template
 * has. Services stay a plain list to keep the overall page quiet.
 */
export function LinenTemplate({ theme, customer, services }) {
  const navigate = useNavigate();
  const { heroMedia, videoReady, setVideoReady } = useHeroMedia(theme);
  const heroEnabled = theme?.heroEnabled !== false;
  const primaryColor = theme?.colors?.primary || '#57534e';
  const accentColor = theme?.colors?.accent || '#b45309';
  const { showInNav, showInHero } = businessNameVisibility(theme);
  const activeServices = (services || []).filter((s) => s.active !== false);
  const featureItems = [theme?.contactInfo?.address, theme?.contactInfo?.phone, theme?.contactInfo?.email].filter(Boolean);

  return (
    <div data-testid="landing-template-linen" className={styles.page} style={{ '--brand': primaryColor, '--accent': accentColor }}>
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
            {theme?.heroBadgeText && <div className={styles.heroBadge}>{theme.heroBadgeText}</div>}
            {showInHero && <h1 className={styles.heroTitle}>{theme?.businessName}</h1>}
            {theme?.tagline && <p className={styles.heroTagline}>{theme.tagline}</p>}
            <button type="button" className={styles.primaryCta} onClick={() => navigate('/book')}>
              Book an Appointment
            </button>
          </div>
        </header>
      )}

      {featureItems.length > 0 && (
        <div className={styles.featureStrip}>
          {featureItems.map((item) => (
            <span key={item} className={styles.featureItem}>
              {item}
            </span>
          ))}
        </div>
      )}

      {activeServices.length > 0 && (
        <section className={styles.services}>
          <h2 className={styles.servicesHeading}>Services</h2>
          <div className={styles.serviceList}>
            {activeServices.map((service) => (
              <div key={service._id} className={styles.serviceRow}>
                <span className={styles.serviceName}>{service.name}</span>
                <span className={styles.serviceMeta}>
                  {service.durationMinutes} min · R{service.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer theme={theme} variant="linen" />
    </div>
  );
}
