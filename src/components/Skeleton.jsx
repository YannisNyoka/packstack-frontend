import styles from './Skeleton.module.css';

/** Base shimmer block - pass width/height as CSS values (e.g. '60%', 18). */
export function Skeleton({ width = '100%', height = 14, radius, className = '' }) {
  return (
    <span
      className={`${styles.block} ${className}`}
      style={{ width, height: typeof height === 'number' ? `${height}px` : height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

/** Matches OverviewPage/AnalyticsPage's stat-card grid while data loads. */
export function SkeletonStatGrid({ count = 8 }) {
  return (
    <div className={styles.statGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.statCard}>
          <Skeleton width={20} height={20} radius="6px" />
          <Skeleton width="70%" height={22} />
          <Skeleton width="50%" height={11} />
        </div>
      ))}
    </div>
  );
}

/** Matches the `.table` list pages (Staff/Services/Customers/Appointments) while data loads. */
export function SkeletonTable({ rows = 4, cols = 4 }) {
  return (
    <div className={styles.table} role="presentation">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={styles.tableRow}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width={c === 0 ? '60%' : '80%'} height={13} />
          ))}
        </div>
      ))}
    </div>
  );
}
