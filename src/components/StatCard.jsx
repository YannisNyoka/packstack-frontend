import styles from './StatCard.module.css';

/**
 * tone must be one of the fixed slots in StatCard.module.css
 * (blue/orange/aqua/yellow/magenta/green/violet/red). `icon` is a lucide-react
 * component (not an element) - StatCard owns sizing so every card's icon
 * renders at the same weight regardless of which icon a caller picks.
 */
export function StatCard({ label, value, icon: Icon, tone }) {
  return (
    <div className={`${styles.card} ${styles[tone] || styles.blue}`}>
      <span className={styles.iconWrap} aria-hidden="true">
        <Icon size={18} strokeWidth={2.25} />
      </span>
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
