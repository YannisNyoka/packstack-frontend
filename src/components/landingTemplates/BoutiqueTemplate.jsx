import { useNavigate, Link } from 'react-router-dom';
import { Footer } from '../Footer.jsx';
import { businessNameVisibility } from './businessNameVisibility.js';
import styles from './BoutiqueTemplate.module.css';

/**
 * Soft, playful, nail-bar/beauty-studio register: a pastel wash background
 * instead of a full-bleed photo hero, the hero image framed as a tilted
 * "stacked card" with a solid color panel peeking out behind it, and
 * services as wrapped rounded chips rather than a strict grid. Deliberately
 * skips useHeroMedia's video carousel (same reasoning as BoldTemplate) - a
 * small framed card is the wrong shape for an autoplaying background video.
 */
export function BoutiqueTemplate({ theme, customer, services }) {
  const navigate = useNavigate();
  const heroEnabled = theme?.heroEnabled !== false;
  const primaryColor = theme?.colors?.primary || '#111827';
  const accentColor = theme?.colors?.accent || '#f472b6';
  const { showInNav, showInHero } = businessNameVisibility(theme);
  const activeServices = (services || []).filter((s) => s.active !== false);

  return (
    <div data-testid="landing-template-boutique" className={styles.page} style={{ '--brand': primaryColor, '--accent': accentColor }}>
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
          <div className={styles.heroCopy}>
            {theme?.heroBadgeText && <div className={styles.heroBadge}>{theme.heroBadgeText}</div>}
            {showInHero && <h1 className={styles.heroTitle}>{theme?.businessName}</h1>}
            {theme?.tagline && <p className={styles.heroTagline}>{theme.tagline}</p>}
            <button type="button" className={styles.primaryCta} onClick={() => navigate('/book')}>
              Book Appointment
            </button>
          </div>
          <div className={styles.heroFrame}>
            <div className={styles.heroFrameBack} />
            <div className={styles.heroFrameCard}>
              {theme?.bannerUrl ? <img src={theme.bannerUrl} alt="" className={styles.heroImage} /> : <div className={styles.heroPlaceholder} />}
            </div>
          </div>
        </header>
      )}

      {activeServices.length > 0 && (
        <section className={styles.services}>
          <h2 className={styles.servicesHeading}>What We Offer</h2>
          <div className={styles.serviceChips}>
            {activeServices.map((service) => (
              <div key={service._id} className={styles.serviceChip}>
                <span className={styles.serviceName}>{service.name}</span>
                <span className={styles.serviceMeta}>
                  {service.durationMinutes} min · R{service.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer theme={theme} variant="boutique" />
    </div>
  );
}
