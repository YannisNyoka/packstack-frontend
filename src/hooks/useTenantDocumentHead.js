import { useEffect } from 'react';

/**
 * Crops/resizes a tenant's uploaded logo into a square favicon on the fly -
 * no new upload flow, no stored asset, no ThemeConfig field. Cloudinary
 * delivery URLs are always `.../image/upload/<...>/<publicId>`; inserting a
 * transformation string right after `/upload/` is the standard way to get a
 * derived version of an already-uploaded asset. g_auto lets Cloudinary's
 * content-aware cropping pick the most relevant region instead of a blind
 * center-crop, which matters since most logos aren't uploaded pre-square.
 */
export function deriveFaviconUrl(logoUrl) {
  if (!logoUrl) return null;
  const marker = '/upload/';
  const idx = logoUrl.indexOf(marker);
  if (idx === -1) return logoUrl; // not a Cloudinary URL - just use it as-is rather than guessing
  const insertAt = idx + marker.length;
  return `${logoUrl.slice(0, insertAt)}w_64,h_64,c_fill,g_auto,f_auto,q_auto/${logoUrl.slice(insertAt)}`;
}

/**
 * Same Cloudinary-transform trick as deriveFaviconUrl, generalized to any
 * square size - used for PWA manifest icons and the apple-touch-icon, which
 * both need to be real image/png files (not favicon-style f_auto) at
 * specific sizes rather than a single 64px crop. Kept as a separate
 * function rather than generalizing deriveFaviconUrl itself, so the
 * already-shipped favicon behavior can't regress from a refactor here.
 */
export function deriveIconUrl(sourceUrl, size) {
  if (!sourceUrl) return null;
  const marker = '/upload/';
  const idx = sourceUrl.indexOf(marker);
  if (idx === -1) return sourceUrl;
  const insertAt = idx + marker.length;
  return `${sourceUrl.slice(0, insertAt)}w_${size},h_${size},c_fill,g_auto,f_png,q_auto/${sourceUrl.slice(insertAt)}`;
}

function setOrCreateLink(rel, href, extraAttrs = {}) {
  let link = document.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
  for (const [key, value] of Object.entries(extraAttrs)) link.setAttribute(key, value);
  return link;
}

function setOrCreateMeta(name, content) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
  return meta;
}

// Captured once, at module load, before any tenant page has had a chance to
// override them - this is what gets restored when a tenant-branded page
// unmounts (e.g. logging in navigates client-side from the login page into
// /dashboard, which never calls this hook and so would otherwise be stuck
// showing whichever tenant's favicon/title/manifest the login page last set).
const DEFAULT_TITLE = typeof document !== 'undefined' ? document.title : '';
const DEFAULT_ICON_LINK = typeof document !== 'undefined' ? document.querySelector('link[rel="icon"]') : null;
const DEFAULT_FAVICON_HREF = DEFAULT_ICON_LINK?.href ?? null;
const DEFAULT_FAVICON_TYPE = DEFAULT_ICON_LINK?.getAttribute('type') ?? null;
const DEFAULT_MANIFEST_HREF = typeof document !== 'undefined' ? document.querySelector('link[rel="manifest"]')?.href ?? null : null;
const DEFAULT_APPLE_ICON_HREF = typeof document !== 'undefined' ? document.querySelector('link[rel="apple-touch-icon"]')?.href ?? null : null;
const DEFAULT_THEME_COLOR = typeof document !== 'undefined' ? document.querySelector('meta[name="theme-color"]')?.content ?? null : null;
const DEFAULT_APPLE_TITLE = typeof document !== 'undefined' ? document.querySelector('meta[name="apple-mobile-web-app-title"]')?.content ?? null : null;

let currentManifestBlobUrl = null;

/**
 * Sets the browser tab's title, favicon, and PWA installability metadata
 * (web manifest, apple-touch-icon, theme-color) to match the tenant whose
 * public page is currently loaded, and restores PackStack's own defaults
 * when that page unmounts - navigating from a tenant page (e.g. login) into
 * a non-tenant one (e.g. /dashboard) is a client-side route change, not a
 * full reload, so nothing else would ever reset the tab back. Falls back to
 * index.html's static defaults (title "packstack-frontend", /favicon.svg,
 * the PackStack-branded manifest vite-plugin-pwa generates) until theme
 * data has actually loaded, and again for any tenant who hasn't uploaded a
 * logo yet - no new upload step required to benefit here.
 *
 * The manifest is rebuilt as an in-memory object and handed to the browser
 * via a Blob URL rather than a real file, since every tenant needs a
 * different one (their own name/icon) and there's no per-tenant build step
 * to generate one from. Each tenant already lives on its own subdomain, so
 * the browser's own per-origin PWA scoping keeps every tenant's "Add to
 * Home Screen" install completely separate with no extra work here - a
 * Nailsbynaledi customer gets an icon that says "Nailsbynaledi", not a
 * generic "PackStack" app they'd have to pick their salon inside.
 *
 * faviconUrl (ThemeConfig.faviconUrl) lets a tenant override the favicon
 * outright instead of relying on the auto-crop of their logo - a wide or
 * rectangular logo can crop badly at favicon size, so an explicit favicon
 * always wins when set. The same override is reused for the larger PWA/
 * apple-touch icons for the same reason.
 */
export function useTenantDocumentHead({ businessName, logoUrl, faviconUrl: explicitFaviconUrl, themeColor } = {}) {
  useEffect(() => {
    if (businessName) {
      document.title = businessName;
    }

    const faviconUrl = deriveFaviconUrl(explicitFaviconUrl || logoUrl);
    if (faviconUrl) {
      const link = setOrCreateLink('icon', faviconUrl);
      link.removeAttribute('type'); // no longer necessarily the static favicon.svg's declared type
    }

    const iconSource = explicitFaviconUrl || logoUrl;
    const resolvedThemeColor = themeColor || DEFAULT_THEME_COLOR || '#0F172A';
    setOrCreateMeta('theme-color', resolvedThemeColor);
    if (businessName) {
      setOrCreateMeta('apple-mobile-web-app-title', businessName);
    }

    let revokeUrl = null;
    const canBuildManifest = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
    if (canBuildManifest && (iconSource || businessName)) {
      const icon192 = deriveIconUrl(iconSource, 192) || DEFAULT_APPLE_ICON_HREF;
      const icon512 = deriveIconUrl(iconSource, 512) || DEFAULT_APPLE_ICON_HREF;
      if (icon192) setOrCreateLink('apple-touch-icon', icon192);

      const manifest = {
        name: businessName || 'PackStack',
        short_name: (businessName || 'PackStack').slice(0, 30),
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: resolvedThemeColor,
        icons: [
          icon192 && { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
          icon512 && { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
        ].filter(Boolean),
      };
      const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
      const blobUrl = URL.createObjectURL(blob);
      setOrCreateLink('manifest', blobUrl);
      if (currentManifestBlobUrl) URL.revokeObjectURL(currentManifestBlobUrl);
      currentManifestBlobUrl = blobUrl;
      revokeUrl = blobUrl;
    }

    return () => {
      document.title = DEFAULT_TITLE;

      const link = document.querySelector('link[rel="icon"]');
      if (link && DEFAULT_FAVICON_HREF) {
        link.href = DEFAULT_FAVICON_HREF;
        if (DEFAULT_FAVICON_TYPE) {
          link.setAttribute('type', DEFAULT_FAVICON_TYPE);
        } else {
          link.removeAttribute('type');
        }
      }

      if (DEFAULT_MANIFEST_HREF) setOrCreateLink('manifest', DEFAULT_MANIFEST_HREF);
      if (DEFAULT_APPLE_ICON_HREF) setOrCreateLink('apple-touch-icon', DEFAULT_APPLE_ICON_HREF);
      if (DEFAULT_THEME_COLOR) setOrCreateMeta('theme-color', DEFAULT_THEME_COLOR);
      if (DEFAULT_APPLE_TITLE) setOrCreateMeta('apple-mobile-web-app-title', DEFAULT_APPLE_TITLE);

      if (revokeUrl && revokeUrl === currentManifestBlobUrl) {
        URL.revokeObjectURL(revokeUrl);
        currentManifestBlobUrl = null;
      }
    };
  }, [businessName, logoUrl, explicitFaviconUrl, themeColor]);
}
