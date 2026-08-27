import { useNavigate, Link } from 'react-router-dom';
import { Footer } from '../Footer.jsx';
import styles from './MinimalTemplate.module.css';

/**
 * Deliberately quiet - thin type, lots of whitespace, no forced hero image
 * (works whether or not a banner/video is set - a plain background either
 * way keeps this template's restraint intact), a plain text service list
 * instead of image cards, and Footer's own 'minimal' variant collapses to
 * a single slim bar.
 */
export function MinimalTemplate({ theme, customer, services }) {
  const navigate = useNavigate();
  const heroEnabled = theme?.heroEnabled !== false;
  const primaryColor = theme?.colors?.primary || '#111827';
  const activeServices = (services || []).filter((s) => s.active !== false);

  return (
    <div data-testid="landing-template-minimal" className={styles.page} style={{ '--brand': primaryColor }}>
      <nav className={styles.nav}>
        {theme?.logoUrl ? (
          <img src={theme.logoUrl} alt={theme?.businessName} className={styles.navLogo} />
        ) : (
          <span className={styles.navBrand}>{theme?.businessName}</span>
        )}
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
          {theme?.heroBadgeText && <div className={styles.heroBadge}>{theme.heroBadgeText}</div>}
          <h1 className={styles.heroTitle}>{theme?.businessName}</h1>
          {theme?.tagline && <p className={styles.heroTagline}>{theme.tagline}</p>}
          <button type="button" className={styles.primaryCta} onClick={() => navigate('/book')}>
            Book an appointment
          </button>
        </header>
      )}

      {activeServices.length > 0 && (
        <section className={styles.services}>
          <h2 className={styles.servicesHeading}>Services</h2>
          <ul className={styles.serviceList}>
            {activeServices.map((service) => (
              <li key={service._id} className={styles.serviceRow}>
                <span className={styles.serviceName}>{service.name}</span>
                <span className={styles.serviceDots} />
                <span className={styles.serviceMeta}>
                  {service.durationMinutes} min · R{service.price.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Footer theme={theme} variant="minimal" />
    </div>
  );
}
