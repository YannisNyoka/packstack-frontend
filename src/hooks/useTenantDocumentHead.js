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

// Captured once, at module load, before any tenant page has had a chance to
// override them - this is what gets restored when a tenant-branded page
// unmounts (e.g. logging in navigates client-side from the login page into
// /dashboard, which never calls this hook and so would otherwise be stuck
// showing whichever tenant's favicon/title the login page last set).
const DEFAULT_TITLE = typeof document !== 'undefined' ? document.title : '';
const DEFAULT_ICON_LINK = typeof document !== 'undefined' ? document.querySelector('link[rel="icon"]') : null;
const DEFAULT_FAVICON_HREF = DEFAULT_ICON_LINK?.href ?? null;
const DEFAULT_FAVICON_TYPE = DEFAULT_ICON_LINK?.getAttribute('type') ?? null;

/**
 * Sets the browser tab's title and favicon to match the tenant whose
 * public page is currently loaded, and restores PackStack's own defaults
 * when that page unmounts - navigating from a tenant page (e.g. login) into
 * a non-tenant one (e.g. /dashboard) is a client-side route change, not a
 * full reload, so nothing else would ever reset the tab back. Falls back to
 * index.html's static defaults (title "packstack-frontend", /favicon.svg)
 * until theme data has actually loaded, and again for any tenant who
 * hasn't uploaded a logo yet - no new upload step required to benefit here.
 */
export function useTenantDocumentHead({ businessName, logoUrl } = {}) {
  useEffect(() => {
    if (businessName) {
      document.title = businessName;
    }

    const faviconUrl = deriveFaviconUrl(logoUrl);
    if (faviconUrl) {
      let link = document.querySelector('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.removeAttribute('type'); // no longer necessarily the static favicon.svg's declared type
      link.href = faviconUrl;
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
    };
  }, [businessName, logoUrl]);
}
