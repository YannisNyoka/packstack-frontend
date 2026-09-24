import * as Sentry from '@sentry/react';

/**
 * Catches a render-time crash in whatever it wraps and reports it to Sentry
 * (via Sentry.ErrorBoundary), instead of the crash unmounting the whole
 * React tree - which, with no boundary anywhere, is what previously turned
 * any unhandled error into a blank white screen for a customer mid-booking
 * or a staff member mid-shift, with no way back short of manually
 * navigating away. Meant to sit inside a persistent layout (around just its
 * own <Outlet />, the same placement as the Suspense boundaries next to it)
 * so a crash on one page doesn't also take the sidebar/nav down with it -
 * see main.jsx for the one wrapping the whole app as a last-resort backstop.
 */
export function RouteErrorBoundary({ children }) {
  return (
    <Sentry.ErrorBoundary
      fallback={() => (
        <div className="card" style={{ maxWidth: 480, margin: '48px auto', textAlign: 'center' }}>
          <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
          <p className="muted">This page ran into an unexpected error. Reloading usually fixes it.</p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      )}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
