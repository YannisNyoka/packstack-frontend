import { useEffect, useState } from 'react';
import { LandingPreview } from '../components/LandingPreview.jsx';

/**
 * Rendered inside an <iframe> by BrandingSettingsPage.jsx's live preview (see
 * DevicePreview there) - a real, separate browsing context is the only way
 * to preview accurately, since vh units and @media queries resolve against
 * the actual window they're in. A transform-scaled <div> inside the same
 * page as the settings form can't simulate a phone's viewport: 100vh there
 * still means "100% of the settings page's own window."
 *
 * Has no theme of its own - the parent posts the in-progress (unsaved) form
 * state across on every edit, starting once this frame announces it's ready
 * to receive it.
 */
export function PreviewFramePage() {
  const [theme, setTheme] = useState(null);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    function handleMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'packstack-preview-theme') return;
      setTheme(event.data.theme);
      setCustomer(event.data.customer || null);
    }
    window.addEventListener('message', handleMessage);
    window.parent.postMessage({ type: 'packstack-preview-ready' }, window.location.origin);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!theme) return null;

  return <LandingPreview theme={theme} customer={customer} />;
}
