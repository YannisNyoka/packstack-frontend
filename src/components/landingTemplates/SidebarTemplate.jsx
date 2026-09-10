import { useNavigate, Link } from 'react-router-dom';
import { Footer } from '../Footer.jsx';
import { useHeroMedia } from './useHeroMedia.js';
import { businessNameVisibility } from './businessNameVisibility.js';
import styles from './SidebarTemplate.module.css';

/**
 * App-like register: a persistent vertical sidebar (logo/name stacked at
 * top, nav links stacked below, Book Now pinned at the bottom) instead of a
 * horizontal top bar - the only template where the nav isn't a bar of any
 * kind. Collapses to a horizontal top bar on mobile (see the media query).
 */
export function SidebarTemplate({ theme, customer, services }) {
  const navigate = useNavigate();
  const { heroMedia, videoReady, setVideoReady } = useHeroMedia(theme);
  const heroEnabled = theme?.heroEnabled !== false;
  const primaryColor = theme?.colors?.primary || '#111827';
  const accentColor = theme?.colors?.accent || primaryColor;
  const { showInNav, showInHero } = businessNameVisibility(theme);
  const activeServices = (services || []).filter((s) => s.active !== false);

  return (
    <div data-testid="landing-template-sidebar" className={styles.page} style={{ '--brand': primaryColor, '--accent': accentColor }}>
      <nav className={styles.sidebar}>
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
            <>
              <Link to="/account/login" className={styles.navLink}>
                Sign in
              </Link>
              <Link to="/account/signup" className={styles.navLink}>
                Sign up
              </Link>
            </>
          )}
        </div>
        <Link to="/book" className={styles.navCta}>
          Book Now
        </Link>
      </nav>

      <div className={styles.main}>
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

        <Footer theme={theme} variant="sidebar" />
      </div>
    </div>
  );
}
