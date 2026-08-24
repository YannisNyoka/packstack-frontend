import { Link, useNavigate } from 'react-router-dom';
import { Footer } from './Footer.jsx';
import styles from '../pages/LandingPage.module.css';

/**
 * The actual landing page markup (nav + hero + footer), extracted out of
 * pages/LandingPage.jsx so it can be reused two ways: the real public route
 * (fetches theme from the API, knows the logged-in customer) and the live
 * preview in Settings > Branding (fed the in-progress, unsaved form state
 * instead, no logged-in customer to speak of) - see SettingsPage.jsx.
 * Takes `theme`/`customer` as plain props rather than reading them from
 * context itself, so it has no provider dependencies of its own.
 */
export function LandingPreview({ theme, customer = null }) {
  const navigate = useNavigate();

  const primaryColor = theme?.colors?.primary || '#111827';
  const accentColor = theme?.colors?.accent || primaryColor;
  const heroEnabled = theme?.heroEnabled !== false;
  const heroMedia =
    theme?.heroMediaType === 'video' && theme?.heroVideoUrl
      ? { type: 'video', src: theme.heroVideoUrl }
      : theme?.bannerUrl
        ? { type: 'image', src: theme.bannerUrl }
        : null;

  return (
    <div
      className={styles.page}
      style={{ '--brand': primaryColor, '--color-primary': primaryColor, '--color-accent': accentColor }}
    >
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          {theme?.logoUrl && <img src={theme.logoUrl} alt="" className={styles.navLogo} />}
          <span>{theme?.businessName}</span>
        </div>
        <div className={styles.navLinks}>
          <Link to={customer ? '/account' : '/account/login'} className={styles.navLink}>
            {customer ? 'My Account' : 'Log in'}
          </Link>
          <Link to="/book" className={styles.navCta}>
            Book Now
          </Link>
        </div>
      </nav>

      {heroEnabled ? (
        <header className={styles.hero}>
          {heroMedia?.type === 'video' && (
            <video className={styles.heroMedia} src={heroMedia.src} autoPlay muted loop playsInline />
          )}
          {heroMedia?.type === 'image' && <img className={styles.heroMedia} src={heroMedia.src} alt="" />}
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            {theme?.heroBadgeText && <div className={styles.heroBadge}>{theme.heroBadgeText}</div>}
            <h1 className={styles.heroTitle}>{theme?.businessName}</h1>
            {theme?.tagline && <p className={styles.heroTagline}>{theme.tagline}</p>}
            <button type="button" className={styles.primaryCta} onClick={() => navigate('/book')}>
              Book Appointment
            </button>
          </div>
        </header>
      ) : (
        <header className={styles.simpleHeader}>
          {theme?.logoUrl && <img src={theme.logoUrl} alt="" className={styles.simpleLogo} />}
          <h1>{theme?.businessName}</h1>
          {theme?.tagline && <p className="muted">{theme.tagline}</p>}
          <button type="button" className={styles.primaryCta} onClick={() => navigate('/book')}>
            Book Appointment
          </button>
        </header>
      )}

      <Footer theme={theme} />
    </div>
  );
}
