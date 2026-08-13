// Resolves which tenant this app is running for. In production a tenant is
// reached either via its own subdomain (<slug>.BASE_DOMAIN) or a verified
// custom domain - see packstack-backend's architecture doc §2.1/§3. There's
// no wildcard DNS for local dev, so localhost falls back to
// VITE_DEV_TENANT_SLUG instead (set it in .env.local, gitignored).
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

let resolvedSlug = null;

/**
 * Must be awaited once, before anything renders - see main.jsx. The
 * subdomain and dev-localhost cases resolve synchronously in practice, but
 * a custom domain needs an unauthenticated round-trip to
 * GET /api/public/domains/:domain (the one endpoint that works with no
 * tenant context bound at all) to find out which tenant it maps to.
 */
export async function resolveTenantSlug() {
  const host = window.location.hostname;

  if (host === 'localhost' || host === '127.0.0.1') {
    const devSlug = import.meta.env.VITE_DEV_TENANT_SLUG;
    if (!devSlug) {
      throw new Error('Set VITE_DEV_TENANT_SLUG in .env.local to pick which tenant this dev server talks to.');
    }
    resolvedSlug = devSlug;
    return resolvedSlug;
  }

  const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'packstack.co.za';
  if (host.endsWith(`.${baseDomain}`)) {
    resolvedSlug = host.slice(0, -(baseDomain.length + 1));
    return resolvedSlug;
  }

  // A domain that isn't verified for any tenant fails here two ways: the
  // backend 404s it, or - since config/cors.js only allows origins it
  // recognizes as a verified custom domain - the browser never even lets us
  // read the response (a generic "Failed to fetch" TypeError). Both mean
  // the same thing to a visitor, so both collapse to the same message.
  let slug;
  try {
    const res = await fetch(`${API_BASE}/api/public/domains/${host}`);
    if (!res.ok) throw new Error('not ok');
    ({ slug } = await res.json());
  } catch {
    throw new Error(`No PackStack site is set up at "${host}".`);
  }
  resolvedSlug = slug;
  return resolvedSlug;
}

/**
 * Synchronous accessor every apiFetch() call relies on. Safe only after
 * resolveTenantSlug() has resolved once at boot - the app never renders
 * anything that calls apiFetch before that finishes (see main.jsx).
 */
export function getTenantSlug() {
  if (!resolvedSlug) {
    throw new Error('getTenantSlug() called before the tenant was resolved - see resolveTenantSlug() in main.jsx.');
  }
  return resolvedSlug;
}
