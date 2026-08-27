import { useNavigate, Link } from 'react-router-dom';
import { Footer } from '../Footer.jsx';
import { useHeroMedia } from './useHeroMedia.js';
import styles from './ClassicTemplate.module.css';

/**
 * The original, unstyled-choice landing page design - transparent nav over
 * a full-bleed hero, centered-left hero copy, standard footer. Kept
 * pixel-for-pixel as it always looked, since this is the default template
 * (see ThemeConfig.template) - every tenant who's never touched the new
 * Template picker in Branding settings keeps seeing exactly this.
 */
export function ClassicTemplate({ theme, customer }) {
  const navigate = useNavigate();
  const { heroMedia, videoReady, setVideoReady } = useHeroMedia(theme);
  const heroEnabled = theme?.heroEnabled !== false;
  const primaryColor = theme?.colors?.primary || '#111827';
  const accentColor = theme?.colors?.accent || primaryColor;

  return (
    <div
      data-testid="landing-template-classic"
      className={styles.page}
      style={{ '--brand': primaryColor, '--color-primary': primaryColor, '--color-accent': accentColor }}
    >
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

      {heroEnabled ? (
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

      <Footer theme={theme} variant="classic" />
    </div>
  );
}
