import { useEffect } from 'react';
import { setOrCreateLink, setOrCreateMeta, setOrCreateOgMeta, setOrCreateJsonLd } from './useTenantDocumentHead.js';

/**
 * Sets a tenant's public page description, canonical URL, Open Graph tags,
 * and LocalBusiness (HealthAndBeautyBusiness) JSON-LD - the tenant-side
 * counterpart to the marketing site's useSEO.js. Unlike useTenantDocumentHead
 * (which updates title/favicon tags index.html already ships statically),
 * index.html here ships NONE of these - there's nothing to restore on
 * unmount, only something to remove.
 *
 * This genuinely helps Googlebot/Bingbot (which render JS) and rich-result
 * eligibility today. It does NOT reach non-JS AI crawlers (GPTBot, ClaudeBot,
 * PerplexityBot, CCBot) - this app is pure client-side-rendered with no SSR,
 * so none of these tags exist in the raw HTML response those crawlers
 * actually fetch. See api/llms.txt.js for the piece that does reach them.
 * This hook is still worth having now: it's groundwork that activates
 * automatically once real SSR exists for this app.
 */
export function useTenantSEO({ theme, services, path = '' } = {}) {
  useEffect(() => {
    if (!theme?.businessName) return undefined;

    const url = `${window.location.origin}${path}`;
    const description = theme.tagline || `Book online with ${theme.businessName}.`;

    const descriptionMeta = setOrCreateMeta('description', description);
    const canonicalLink = setOrCreateLink('canonical', url);
    const ogTitle = setOrCreateOgMeta('og:title', theme.businessName);
    const ogDescription = setOrCreateOgMeta('og:description', description);
    const ogUrl = setOrCreateOgMeta('og:url', url);
    const ogType = setOrCreateOgMeta('og:type', 'website');
    const ogImage = theme.bannerUrl || theme.logoUrl ? setOrCreateOgMeta('og:image', theme.bannerUrl || theme.logoUrl) : null;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'HealthAndBeautyBusiness',
      name: theme.businessName,
      url,
      ...(description && { description }),
      ...(theme.bannerUrl || theme.logoUrl ? { image: theme.bannerUrl || theme.logoUrl } : {}),
      ...(theme.contactInfo?.phone && { telephone: theme.contactInfo.phone }),
      ...(theme.contactInfo?.email && { email: theme.contactInfo.email }),
      ...(theme.contactInfo?.address && { address: theme.contactInfo.address }),
      ...(services?.length && {
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Services',
          itemListElement: services.map((s) => ({
            '@type': 'Offer',
            price: Number(s.price).toFixed(2),
            priceCurrency: 'ZAR',
            itemOffered: { '@type': 'Service', name: s.name, description: `${s.durationMinutes} minutes` },
          })),
        },
      }),
    };
    const sameAs = [theme.socialLinks?.instagram, theme.socialLinks?.facebook, theme.socialLinks?.tiktok, theme.socialLinks?.website].filter(Boolean);
    if (sameAs.length) jsonLd.sameAs = sameAs;

    const script = setOrCreateJsonLd(jsonLd);

    return () => {
      descriptionMeta.remove();
      canonicalLink.remove();
      ogTitle.remove();
      ogDescription.remove();
      ogUrl.remove();
      ogType.remove();
      if (ogImage) ogImage.remove();
      script.remove();
    };
  }, [theme, services, path]);
}
