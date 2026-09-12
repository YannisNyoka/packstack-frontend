import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Footer, directionsHref } from '../Footer.jsx';
import { businessNameVisibility } from './businessNameVisibility.js';
import styles from './FlareTemplate.module.css';

const INITIAL_VISIBLE_SERVICES = 6;

/**
 * Dark, appointment-app register distinct from every other dark template
 * (Noir's stark monochrome, Neon's glow, Aura's spotlight): a full-bleed
 * dark hero photo, then services as individually bookable WHITE cards on a
 * black section (every other template treats services as informational
 * rows/grid with a single hero-level "Book" CTA, not a button per card), a
 * "+ See All" expand toggle once there are more than a handful, and a
 * dedicated WhatsApp CTA in the contact section rather than just an icon.
 */
export function FlareTemplate({ theme, customer, services }) {
  const navigate = useNavigate();
  const [showAllServices, setShowAllServices] = useState(false);
  const heroEnabled = theme?.heroEnabled !== false;
  const primaryColor = theme?.colors?.primary || '#0c0c14';
  const accentColor = theme?.colors?.accent || '#ff2f87';
  const { showInNav, showInHero } = businessNameVisibility(theme);
  const activeServices = (services || []).filter((s) => s.active !== false);
  const visibleServices = showAllServices ? activeServices : activeServices.slice(0, INITIAL_VISIBLE_SERVICES);
  const hasMoreServices = activeServices.length > INITIAL_VISIBLE_SERVICES;

  const contact = theme?.contactInfo || {};
  const whatsapp = theme?.socialLinks?.whatsapp || '';
  const whatsappHref = whatsapp ? `https://wa.me/${whatsapp.replace(/[^\d]/g, '')}` : null;

  return (
    <div data-testid="landing-template-flare" className={styles.page} style={{ '--brand': primaryColor, '--accent': accentColor }}>
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
        <header className={`${styles.hero} ${!theme?.bannerUrl ? styles.heroNoImage : ''}`}>
          {theme?.bannerUrl && <img src={theme.bannerUrl} alt="" className={styles.heroImage} />}
          <div className={styles.heroScrim} />
          <div className={styles.heroContent}>
            {theme?.logoUrl && <img src={theme.logoUrl} alt="" className={styles.heroLogo} />}
            <div className={styles.heroEyebrow}>{theme?.heroBadgeText || 'Welcome'}</div>
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
          <div className={styles.servicesEyebrow}>Online Appointments</div>
          <div className={styles.serviceStack}>
            {visibleServices.map((service) => (
              <div key={service._id} className={styles.serviceCard}>
                <span className={styles.serviceName}>{service.name}</span>
                <span className={styles.serviceMeta}>
                  {service.durationMinutes} {service.durationMinutes === 1 ? 'min' : 'mins'} · R{service.price.toFixed(0)}
                </span>
                <button type="button" className={styles.bookBtn} onClick={() => navigate('/book')}>
                  Book
                </button>
              </div>
            ))}
          </div>
          {hasMoreServices && (
            <button type="button" className={styles.seeAllBtn} onClick={() => setShowAllServices((v) => !v)}>
              {showAllServices ? 'Show less' : `+ See all ${activeServices.length} services`}
            </button>
          )}
        </section>
      )}

      {(contact.address || contact.phone || whatsappHref) && (
        <section className={styles.contactSection}>
          <div className={styles.contactEyebrow}>Contact Us</div>
          {theme?.businessName && <h2 className={styles.contactName}>{theme.businessName}</h2>}
          {contact.address && (
            <>
              <p className={styles.contactLine}>{contact.address}</p>
              <a href={directionsHref(contact.address)} target="_blank" rel="noopener noreferrer" className={styles.directionsLink}>
                Get Directions →
              </a>
            </>
          )}
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className={styles.contactPhone}>
              {contact.phone}
            </a>
          )}
          {whatsappHref && (
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={styles.whatsappBtn}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.55L3 20l1.05-5.4A8.5 8.5 0 1 1 21 11.5z" />
                <path d="M8.5 9.5c0 4 3 6.5 6.5 6.5" />
              </svg>
              Message us on WhatsApp
            </a>
          )}
        </section>
      )}

      <Footer theme={theme} variant="flare" />
    </div>
  );
}
