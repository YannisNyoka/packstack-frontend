import { useEffect, useRef, useState } from 'react';

/**
 * Renders /preview (PreviewFramePage.jsx) inside a real <iframe> at a real
 * device's pixel dimensions, then scales the whole iframe down visually with
 * CSS transform to fit the sidebar. Scaling the iframe element itself (not
 * its content) keeps the document inside it genuinely deviceWidth x
 * deviceHeight, so vh units and @media queries resolve exactly like they
 * would on that device - unlike scaling a same-page <div>, which can only
 * ever reflect the settings page's own window size no matter what width you
 * give it.
 *
 * The frame syncs on a tiny handshake: it announces itself ready, then this
 * component posts the current theme across - both on that first ready
 * signal and again on every subsequent edit, so the preview stays live as
 * the owner types.
 */
export function DevicePreview({ theme, customer, deviceWidth, deviceHeight, boxWidth, label, rounded }) {
  const iframeRef = useRef(null);
  const [ready, setReady] = useState(false);
  const scale = boxWidth / deviceWidth;
  const boxHeight = Math.round(deviceHeight * scale);

  useEffect(() => {
    function handleMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type === 'packstack-preview-ready') setReady(true);
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    iframeRef.current?.contentWindow?.postMessage({ type: 'packstack-preview-theme', theme, customer }, window.location.origin);
  }, [ready, theme, customer]);

  return (
    <div>
      <div
        style={{
          width: boxWidth,
          height: boxHeight,
          overflow: 'hidden',
          border: '8px solid #1a1a1e',
          borderRadius: rounded ? 24 : 10,
          background: '#fff',
        }}
      >
        <iframe
          ref={iframeRef}
          src="/preview"
          title={`${label} preview`}
          style={{
            width: deviceWidth,
            height: deviceHeight,
            border: 'none',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
      </div>
    </div>
  );
}
