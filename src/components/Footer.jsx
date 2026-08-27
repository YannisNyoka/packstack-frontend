import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

// Small inline outline icons - this app has no icon library dependency
// (see index.css's "no component library" note), so a handful of simple
// SVGs is cheaper than pulling one in just for the footer.
const ICONS = {
  instagram: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 8h-2a2 2 0 0 0-2 2v10M9 13h4M15 3H9a6 6 0 0 0-6 6v6a6 6 0 0 0 6 6h6a6 6 0 0 0 6-6V9a6 6 0 0 0-6-6z" />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.55L3 20l1.05-5.4A8.5 8.5 0 1 1 21 11.5z" />
      <path d="M8.5 9.5c0 4 3 6.5 6.5 6.5" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 4v10.5a3.5 3.5 0 1 1-3-3.46" />
      <path d="M14 4a5 5 0 0 0 5 5" />
    </svg>
  ),
  website: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  ),
};

const SOCIAL_LABELS = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  tiktok: 'TikTok',
  website: 'Website',
};

function socialHref(key, value) {
  if (key === 'whatsapp') {
    const digits = value.replace(/[^\d]/g, '');
    return digits ? `https://wa.me/${digits}` : null;
  }
  return value;
}

export function Footer({ theme }) {
  const socialLinks = theme?.socialLinks || {};
  const activeSocials = Object.entries(socialLinks).filter(([, value]) => value && value.trim());
  const contact = theme?.contactInfo || {};
  const hasContact = contact.phone || contact.email || contact.address;

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          {theme?.logoUrl && <img src={theme.logoUrl} alt="" className={styles.logo} />}
          <span className={styles.businessName}>{theme?.businessName}</span>
        </div>

        {hasContact && (
          <div className={styles.contact}>
            {contact.address && <span>{contact.address}</span>}
            {contact.phone && <span>{contact.phone}</span>}
            {contact.email && <span>{contact.email}</span>}
          </div>
        )}

        {activeSocials.length > 0 && (
          <div className={styles.socials}>
            {activeSocials.map(([key, value]) => {
              const href = socialHref(key, value);
              if (!href) return null;
              return (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={SOCIAL_LABELS[key] || key}
                  className={styles.socialLink}
                >
                  {ICONS[key]}
                </a>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.copyright}>
        © {new Date().getFullYear()} {theme?.businessName}. Powered by PackStack.{' '}
        <Link to="/login" className={styles.businessLoginLink}>
          Business login
        </Link>
      </div>
    </footer>
  );
}
