import { resolveTenantSlugFromHost, BACKEND_INTERNAL_URL } from './_lib/resolveTenant.js';

// The GEO fix for tenant pages that doesn't require full SSR: this is a
// Vercel Serverless Function (not part of the React app), so its response
// is plain text returned directly - no JS execution needed to read it,
// unlike every tag the React app sets via useEffect. This is the one piece
// of this pass that actually reaches GPTBot/ClaudeBot/PerplexityBot/CCBot
// for a tenant's own page - see useTenantSEO.js's own comment on why its
// meta tags/JSON-LD don't.
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  // Collapses repeated crawler hits (GPTBot, ClaudeBot, PerplexityBot, CCBot
  // all refetch on their own schedules, across every tenant) onto roughly
  // one backend round-trip per hour per tenant via Vercel's edge cache,
  // instead of one real backend hit per crawler visit - both endpoints this
  // calls are rate-limited per-IP, and every tenant's crawler traffic shares
  // this Function's small pool of outbound IPs.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const slug = await resolveTenantSlugFromHost(host);
  if (!slug) {
    res.statusCode = 404;
    res.end('No PackStack business is set up at this address.\n');
    return;
  }

  let theme;
  let services = [];
  try {
    const [themeRes, servicesRes] = await Promise.all([
      fetch(`${BACKEND_INTERNAL_URL}/api/t/${slug}/public/theme`),
      fetch(`${BACKEND_INTERNAL_URL}/api/t/${slug}/public/services`),
    ]);

    if (themeRes.status === 403) {
      // enforceTenantStatus() 403s /public/* for a suspended tenant - a
      // friendly body, not a raw error, same as the booking page itself
      // would show a real visitor in that state.
      res.end('This business is temporarily unavailable.\n');
      return;
    }
    if (!themeRes.ok) {
      res.statusCode = 404;
      res.end('This business has not finished setting up its page yet.\n');
      return;
    }

    theme = await themeRes.json();
    if (servicesRes.ok) services = await servicesRes.json();
  } catch {
    res.statusCode = 502;
    res.end('This page is temporarily unavailable. Please try again shortly.\n');
    return;
  }

  res.end(formatLlmsTxt(theme, services));
}

function formatLlmsTxt(theme, services) {
  const lines = [`# ${theme.businessName}`];
  if (theme.tagline) lines.push(`> ${theme.tagline}`);

  lines.push('', '## Contact');
  if (theme.contactInfo?.address) lines.push(`Address: ${theme.contactInfo.address}`);
  if (theme.contactInfo?.phone) lines.push(`Phone: ${theme.contactInfo.phone}`);
  if (theme.contactInfo?.email) lines.push(`Email: ${theme.contactInfo.email}`);
  if (theme.socialLinks?.website) lines.push(`Website: ${theme.socialLinks.website}`);

  if (services.length) {
    lines.push('', '## Services');
    services.forEach((s) => lines.push(`- ${s.name} — R${Number(s.price).toFixed(2)} (${s.durationMinutes} min)`));
  }

  lines.push('', '## Booking', 'Book an appointment online at this page directly - no account required.');
  return lines.join('\n') + '\n';
}
