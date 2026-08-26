import styles from './StatCard.module.css';

/** tone must be one of the fixed slots in StatCard.module.css (blue/orange/aqua/yellow/magenta/green/violet/red). */
export function StatCard({ label, value, icon, tone }) {
  return (
    <div className={`${styles.card} ${styles[tone] || styles.blue}`}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
