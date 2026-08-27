import { useNavigate, Link } from 'react-router-dom';
import { Footer } from '../Footer.jsx';
import styles from './EditorialTemplate.module.css';

/**
 * Magazine-style asymmetric hero (large image one side, stacked headline +
 * byline badge the other), services as an editorial list with alternating
 * image-left/image-right rows, and staff in a simple two-column profile
 * grid (name + photo only - StaffMember has no bio field).
 */
export function EditorialTemplate({ theme, customer, services, staff }) {
  const navigate = useNavigate();
  const heroEnabled = theme?.heroEnabled !== false;
  const primaryColor = theme?.colors?.primary || '#111827';
  const accentColor = theme?.colors?.accent || primaryColor;
  const activeServices = (services || []).filter((s) => s.active !== false);
  const activeStaff = (staff || []).filter((s) => s.active !== false && s.photoUrl);

  return (
    <div data-testid="landing-template-editorial" className={styles.page} style={{ '--brand': primaryColor, '--accent': accentColor }}>
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
          <div className={styles.heroImageCol}>{theme?.bannerUrl && <img src={theme.bannerUrl} alt="" className={styles.heroImage} />}</div>
          <div className={styles.heroTextCol}>
            {theme?.heroBadgeText && <div className={styles.heroBadge}>{theme.heroBadgeText}</div>}
            <h1 className={styles.heroTitle}>{theme?.businessName}</h1>
            {theme?.tagline && <p className={styles.heroTagline}>{theme.tagline}</p>}
            <button type="button" className={styles.primaryCta} onClick={() => navigate('/book')}>
              Book Appointment
            </button>
          </div>
        </header>
      )}

      {activeServices.length > 0 && (
        <section className={styles.services}>
          <h2 className={styles.sectionHeading}>The Menu</h2>
          <div className={styles.serviceRows}>
            {activeServices.map((service, i) => (
              <div key={service._id} className={styles.serviceRow} data-reverse={i % 2 === 1}>
                <div className={styles.serviceImageCol}>
                  {service.imageUrl ? (
                    <img src={service.imageUrl} alt="" className={styles.serviceImage} />
                  ) : (
                    <div className={styles.serviceImagePlaceholder} />
                  )}
                </div>
                <div className={styles.serviceTextCol}>
                  <span className={styles.serviceName}>{service.name}</span>
                  {service.category && <span className={styles.serviceCategory}>{service.category}</span>}
                  <span className={styles.serviceMeta}>
                    {service.durationMinutes} min · R{service.price.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeStaff.length > 0 && (
        <section className={styles.team}>
          <h2 className={styles.sectionHeading}>The Team</h2>
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

      <Footer theme={theme} variant="editorial" />
    </div>
  );
}
