/**
 * Suspense fallback for a lazy-loaded route's content area - see App.jsx.
 * Deliberately generic (doesn't know what page is loading) and lightweight;
 * only shown for the brief window while that page's own JS chunk downloads,
 * not a real loading state for its data (each page handles that itself).
 */
export function PageLoadingFallback() {
  return <p className="muted">Loading…</p>;
}
