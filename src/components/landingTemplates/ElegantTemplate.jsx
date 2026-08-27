import { useNavigate, Link } from 'react-router-dom';
import { Footer } from '../Footer.jsx';
import { useHeroMedia } from './useHeroMedia.js';
import styles from './ElegantTemplate.module.css';

/**
 * Full-bleed hero with a centered serif headline, a minimal centered nav,
 * and a "Meet the team" section - StaffMember only has name + photoUrl (no
 * bio field exists), so this shows a photo grid with names, not write-ups.
 */
export function ElegantTemplate({ theme, customer, staff }) {
  const navigate = useNavigate();
  const { heroMedia, videoReady, setVideoReady } = useHeroMedia(theme);
  const heroEnabled = theme?.heroEnabled !== false;
  const primaryColor = theme?.colors?.primary || '#111827';
  const accentColor = theme?.colors?.accent || primaryColor;
  const activeStaff = (staff || []).filter((s) => s.active !== false && s.photoUrl);

  return (
    <div data-testid="landing-template-elegant" className={styles.page} style={{ '--brand': primaryColor, '--accent': accentColor }}>
      <nav className={styles.nav}>
        <Link to="/account/login" className={styles.navLink}>
          {customer ? 'My Account' : 'Sign in'}
        </Link>
        <div className={styles.navBrand}>
          {theme?.logoUrl && <img src={theme.logoUrl} alt="" className={styles.navLogo} />}
          <span>{theme?.businessName}</span>
        </div>
        <Link to="/book" className={styles.navCta}>
          Book Now
        </Link>
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
            <div className={styles.heroDivider} />
            {theme?.tagline && <p className={styles.heroTagline}>{theme.tagline}</p>}
            <button type="button" className={styles.primaryCta} onClick={() => navigate('/book')}>
              Reserve Your Visit
            </button>
          </div>
        </header>
      ) : (
        <header className={styles.simpleHeader}>
          {theme?.logoUrl && <img src={theme.logoUrl} alt="" className={styles.simpleLogo} />}
          <h1 className={styles.simpleTitle}>{theme?.businessName}</h1>
          {theme?.tagline && <p className={styles.simpleTagline}>{theme.tagline}</p>}
          <button type="button" className={styles.primaryCta} onClick={() => navigate('/book')}>
            Reserve Your Visit
          </button>
        </header>
      )}

      {activeStaff.length > 0 && (
        <section className={styles.team}>
          <h2 className={styles.teamHeading}>Meet the Team</h2>
          <div className={styles.teamGrid}>
            {activeStaff.map((member) => (
              <div key={member._id} className={styles.teamMember}>
                <img src={member.photoUrl} alt="" className={styles.teamPhoto} />
                <span className={styles.teamName}>{member.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer theme={theme} variant="elegant" />
    </div>
  );
}
