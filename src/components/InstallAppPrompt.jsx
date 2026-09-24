import { useEffect, useState } from 'react';
import { Share, Smartphone, X } from 'lucide-react';
import styles from './InstallAppPrompt.module.css';

const DISMISS_KEY = 'packstack-install-prompt-dismissed-at';
const DISMISS_COOLDOWN_DAYS = 14;

function isStandalone() {
  try {
    return Boolean(window.matchMedia?.('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  } catch {
    return false; // matchMedia unsupported/throwing shouldn't block the prompt - worst case it shows when already installed
  }
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function recentlyDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    return !Number.isNaN(dismissedAt) && Date.now() - dismissedAt < DISMISS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false; // localStorage unavailable (private mode, etc.) - never block the prompt over this
  }
}

function rememberDismissal() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Nothing to do - worst case the prompt reappears next visit.
  }
}

/**
 * A tenant-branded nudge to install the PWA, shown at a moment the customer
 * has actual reason to trust the business (right after a successful
 * booking - see BookingPage.jsx), not on first page load before they've
 * decided anything. Renders nothing if the app is already running
 * standalone (already installed) or was dismissed within the last two
 * weeks (localStorage, per-tenant-origin since every tenant is its own
 * subdomain - see useTenantDocumentHead.js's own note on why that works).
 *
 * Android/Chrome fires `beforeinstallprompt` when the browser itself
 * decides the page is installable (manifest + service worker present) -
 * captured here and re-triggered on demand via a custom button, since
 * Chrome deprecated showing its own unprompted install banner in favor of
 * letting the site choose the moment. iOS Safari (and any other iOS
 * browser - they're all WebKit under the hood) exposes no such event at
 * all - Apple gives no programmatic way to trigger an install, so the only
 * option there is instructing the customer to do it themselves via the
 * share sheet.
 */
export function InstallAppPrompt({ businessName }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [platform, setPlatform] = useState(null); // 'android' | 'ios' | null
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    if (isIOS()) {
      setPlatform('ios');
      setVisible(true);
      return;
    }

    function handleBeforeInstallPrompt(e) {
      e.preventDefault(); // suppress the browser's own mini-infobar - we show our own banner instead
      setDeferredPrompt(e);
      setPlatform('android');
      setVisible(true);
    }
    function handleAppInstalled() {
      setVisible(false);
      rememberDismissal(); // never worth asking again once actually installed
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice; // resolves either way; 'appinstalled' above is the real success signal
    setDeferredPrompt(null);
    setVisible(false);
    rememberDismissal();
  }

  function handleDismiss() {
    rememberDismissal();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.iconBadge}>
        <Smartphone size={20} strokeWidth={2} />
      </div>
      <div className={styles.text}>
        <strong>Install {businessName ? `the ${businessName} app` : 'this app'}</strong>
        {platform === 'ios' ? (
          <p>
            Tap <Share size={13} strokeWidth={2} className={styles.inlineIcon} aria-label="Share" /> then "Add to Home
            Screen" for faster booking next time.
          </p>
        ) : (
          <p>Add it to your home screen for faster booking next time.</p>
        )}
      </div>
      <div className={styles.actions}>
        {platform === 'android' && (
          <button type="button" className="btn btn-primary btn-sm" onClick={handleInstallClick}>
            Install
          </button>
        )}
        <button type="button" className={styles.dismissBtn} onClick={handleDismiss} aria-label="Dismiss">
          <X size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
