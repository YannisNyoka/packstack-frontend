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
 * Sets the browser tab's title and favicon to match the tenant whose
 * subdomain/page is currently loaded - every public-facing page (booking
 * page, manage-booking page) is scoped to exactly one tenant for its whole
 * session, so there's no "switch back" case to handle. Falls back to
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
    if (!faviconUrl) return;

    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.removeAttribute('type'); // no longer necessarily the static favicon.svg's declared type
    link.href = faviconUrl;
  }, [businessName, logoUrl]);
}
