import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from './Footer.jsx';
import styles from '../pages/LandingPage.module.css';

const HERO_SLIDE_DURATION_MS = 6000;

// Autoplaying video is motion some visitors have explicitly opted out of -
// skip the rotation for them (a single frame still shows, just static).
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  const videoRef = useRef(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [videoReady, setVideoReady] = useState(false);

  const primaryColor = theme?.colors?.primary || '#111827';
  const accentColor = theme?.colors?.accent || primaryColor;
  const heroEnabled = theme?.heroEnabled !== false;

  // heroVideoUrls (plural, rotating carousel) takes priority; heroVideoUrl
  // (singular) is kept only for tenants that uploaded a video before
  // multi-video support existed.
  const heroVideos = theme?.heroVideoUrls?.length > 0 ? theme.heroVideoUrls : theme?.heroVideoUrl ? [theme.heroVideoUrl] : [];
  const useVideo = theme?.heroMediaType === 'video' && heroVideos.length > 0;
  const heroMedia = useVideo
    ? { type: 'video', src: heroVideos[slideIndex % heroVideos.length] }
    : theme?.bannerUrl
      ? { type: 'image', src: theme.bannerUrl }
      : null;

  useEffect(() => {
    if (!useVideo || heroVideos.length < 2 || prefersReducedMotion) return;
    const id = setInterval(() => {
      setVideoReady(false);
      setSlideIndex((i) => (i + 1) % heroVideos.length);
    }, HERO_SLIDE_DURATION_MS);
    return () => clearInterval(id);
  }, [useVideo, heroVideos.length]);

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
              ref={videoRef}
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

      <Footer theme={theme} />
    </div>
  );
}
