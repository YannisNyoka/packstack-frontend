import { useEffect, useState } from 'react';

const HERO_SLIDE_DURATION_MS = 6000;

// Autoplaying video is motion some visitors have explicitly opted out of -
// skip the rotation for them (a single frame still shows, just static).
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Shared across every landing-page template that wants a media hero -
 * resolves which media actually shows (heroVideoUrls plural takes priority
 * over the legacy singular heroVideoUrl; falls back to bannerUrl as a still
 * image) and drives the rotation timer between multiple hero videos. Pure
 * logic, no markup - each template renders its own <video>/<img> around
 * the returned heroMedia.
 */
export function useHeroMedia(theme) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [videoReady, setVideoReady] = useState(false);

  const heroVideos = theme?.heroVideoUrls?.length > 0 ? theme.heroVideoUrls : theme?.heroVideoUrl ? [theme.heroVideoUrl] : [];
  const useVideo = theme?.heroMediaType === 'video' && heroVideos.length > 0;
  const heroMedia = useVideo
    ? { type: 'video', src: heroVideos[slideIndex % heroVideos.length] }
    : theme?.bannerUrl
      ? { type: 'image', src: theme.bannerUrl }
      : null;

  useEffect(() => {
    if (!useVideo || heroVideos.length < 2 || prefersReducedMotion) return;
    const id = setInterval(() => {
      setVideoReady(false);
      setSlideIndex((i) => (i + 1) % heroVideos.length);
    }, HERO_SLIDE_DURATION_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useVideo, heroVideos.length]);

  return { heroMedia, videoReady, setVideoReady };
}
