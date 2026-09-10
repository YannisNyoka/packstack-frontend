import { useNavigate, Link } from 'react-router-dom';
import { Footer } from '../Footer.jsx';
import { businessNameVisibility } from './businessNameVisibility.js';
import styles from './StudioTemplate.module.css';

/**
 * Architectural/grid-first register for a barbershop or design-led studio:
 * an asymmetric two-tile hero (large image tile + a stacked copy tile) laid
 * out like a bento grid instead of one full-bleed panel, and services as a
 * numbered index list (01, 02, 03…) rather than cards or a price table.
 * Skips useHeroMedia's video carousel - the grid tile is a fixed aspect box
 * a rotating video wouldn't sit well in.
 */
export function StudioTemplate({ theme, customer, services }) {
  const navigate = useNavigate();
  const heroEnabled = theme?.heroEnabled !== false;
  const primaryColor = theme?.colors?.primary || '#111827';
  const accentColor = theme?.colors?.accent || primaryColor;
  const { showInNav, showInHero } = businessNameVisibility(theme);
  const activeServices = (services || []).filter((s) => s.active !== false);

  return (
    <div data-testid="landing-template-studio" className={styles.page} style={{ '--brand': primaryColor, '--accent': accentColor }}>
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          {theme?.logoUrl && <img src={theme.logoUrl} alt="" className={styles.navLogo} />}
          {showInNav && <span>{theme?.businessName}</span>}
        </div>
        <div className={styles.navLinks}>
          {customer ? (
            <Link to="/account" className={styles.navLink}>
              Account
            </Link>
          ) : (
            <Link to="/account/login" className={styles.navLink}>
              Sign in
            </Link>
          )}
          <Link to="/book" className={styles.navCta}>
            Book
          </Link>
        </div>
      </nav>

      {heroEnabled && (
        <header className={styles.hero}>
          <div className={styles.heroImageTile}>
            {theme?.bannerUrl ? <img src={theme.bannerUrl} alt="" className={styles.heroImage} /> : <div className={styles.heroPlaceholder} />}
          </div>
          <div className={styles.heroCopyTile}>
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
          <div className={styles.serviceList}>
            {activeServices.map((service, i) => (
              <div key={service._id} className={styles.serviceRow}>
                <span className={styles.serviceIndex}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.serviceName}>{service.name}</span>
                <span className={styles.serviceMeta}>
                  {service.durationMinutes} min · R{service.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer theme={theme} variant="studio" />
    </div>
  );
}
