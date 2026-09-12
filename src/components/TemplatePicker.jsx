import styles from './TemplatePicker.module.css';

const TEMPLATE_OPTIONS = [
  { key: 'classic', name: 'Classic', description: 'Transparent nav over a full hero image or video.' },
  { key: 'modern', name: 'Modern', description: 'Solid nav, split-screen hero, a services grid.' },
  { key: 'elegant', name: 'Elegant', description: 'Full-bleed hero, serif type, meet-the-team photos.' },
  { key: 'bold', name: 'Bold', description: 'Saturated color-block hero, oversized display type.' },
  { key: 'minimal', name: 'Minimal', description: 'Maximum whitespace, a plain text service list.' },
  { key: 'editorial', name: 'Editorial', description: 'Magazine-style asymmetric hero and service rows.' },
  { key: 'luxe', name: 'Luxe', description: 'Dark, centered, italic serif - high-end spa register.' },
  { key: 'boutique', name: 'Boutique', description: 'Pastel wash, tilted framed hero image, chip services.' },
  { key: 'studio', name: 'Studio', description: 'Bento-grid hero, numbered service index.' },
  { key: 'glow', name: 'Glow', description: 'Soft gradient hero with blobs, circular portrait.' },
  { key: 'heritage', name: 'Heritage', description: 'Warm cream, crest emblem, framed menu-card services.' },
  { key: 'loft', name: 'Loft', description: 'Industrial dark nav, offset tilted photo frame.' },
  { key: 'petal', name: 'Petal', description: 'Airy, stacked centered nav, scattered soft blobs.' },
  { key: 'noir', name: 'Noir', description: 'Pure black, oversized left-aligned type, photo strip.' },
  { key: 'horizon', name: 'Horizon', description: 'Full-width photo strip, content band below it.' },
  { key: 'aura', name: 'Aura', description: 'Floating pill nav, spotlight glow behind a portrait.' },
  { key: 'marble', name: 'Marble', description: 'Pale marble wash, roman-numeral service grid.' },
  { key: 'canvas', name: 'Canvas', description: 'Gallery negative space, horizontal-scroll services.' },
  { key: 'velvet', name: 'Velvet', description: 'Jewel-tone, framed hero, table-style service list.' },
  { key: 'pulse', name: 'Pulse', description: 'Diagonal color-block hero, angled service accents.' },
  { key: 'linen', name: 'Linen', description: 'Warm neutral, centered hero, a feature-strip band.' },
  { key: 'sidebar', name: 'Sidebar', description: 'Persistent vertical sidebar nav, app-like feel.' },
  { key: 'neon', name: 'Neon', description: 'Dark grid texture, glowing neon outlines.' },
  { key: 'terrazzo', name: 'Terrazzo', description: 'Confetti pattern, bubbly type, tilted pill services.' },
  { key: 'neumorphic', name: 'Neumorphic', description: 'Soft-UI raised cards, calm monochrome surface.' },
  { key: 'flare', name: 'Flare', description: 'Dark photo hero, bookable white service cards, WhatsApp CTA.' },
];

/**
 * A quick-selection grid of 6 abstract layout diagrams (not live-rendered
 * mini templates) - the accurate live preview is the existing Desktop/
 * Mobile DevicePreview panel next to this in BrandingSettingsPage.jsx,
 * which re-renders the real chosen template the instant `value` changes.
 * This picker just needs to give a quick sense of each layout's shape,
 * tinted with the tenant's own current colors so it feels personalized.
 */
export function TemplatePicker({ value, colors, onChange }) {
  const primary = colors?.primary || '#111827';
  const accent = colors?.accent || primary;

  return (
    <div className={styles.grid} role="radiogroup" aria-label="Landing page template">
      {TEMPLATE_OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          role="radio"
          aria-checked={value === option.key}
          className={`${styles.card} ${value === option.key ? styles.cardSelected : ''}`}
          onClick={() => onChange(option.key)}
          style={{ '--mock-primary': primary, '--mock-accent': accent }}
        >
          <div className={styles.mockup} data-template={option.key}>
            <div className={styles.mockNav} />
            <div className={styles.mockBody}>
              <div className={styles.mockPanel} />
              <div className={styles.mockLines}>
                <span className={styles.mockLine} />
                <span className={styles.mockLine} />
                <span className={styles.mockLineShort} />
              </div>
            </div>
          </div>
          <span className={styles.cardName}>{option.name}</span>
          <span className={styles.cardDescription}>{option.description}</span>
        </button>
      ))}
    </div>
  );
}
