import styles from './TemplatePicker.module.css';

const TEMPLATE_OPTIONS = [
  { key: 'classic', name: 'Classic', description: 'Transparent nav over a full hero image or video.' },
  { key: 'modern', name: 'Modern', description: 'Solid nav, split-screen hero, a services grid.' },
  { key: 'elegant', name: 'Elegant', description: 'Full-bleed hero, serif type, meet-the-team photos.' },
  { key: 'bold', name: 'Bold', description: 'Saturated color-block hero, oversized display type.' },
  { key: 'minimal', name: 'Minimal', description: 'Maximum whitespace, a plain text service list.' },
  { key: 'editorial', name: 'Editorial', description: 'Magazine-style asymmetric hero and service rows.' },
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
