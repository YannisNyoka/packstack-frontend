// Server-side port of src/api/tenant.js#resolveTenantSlug's hostname logic.
// Can't import that file directly - it reads window.location/import.meta.env,
// neither of which exist in a Vercel Function's Node runtime. Keep both in
// sync by hand if the resolution rules ever change.
const BASE_DOMAIN = process.env.BASE_DOMAIN || 'packstack.co.za';
const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000';

export async function resolveTenantSlugFromHost(host) {
  if (!host) return null;
  const bareHost = host.split(':')[0].toLowerCase();

  if (bareHost.endsWith(`.${BASE_DOMAIN}`)) {
    return bareHost.slice(0, -(BASE_DOMAIN.length + 1));
  }

  try {
    const res = await fetch(`${BACKEND_INTERNAL_URL}/api/public/domains/${bareHost}`);
    if (!res.ok) return null;
    const { slug } = await res.json();
    return slug || null;
  } catch {
    return null;
  }
}

export { BACKEND_INTERNAL_URL };
