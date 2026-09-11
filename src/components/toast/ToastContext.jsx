import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);
const DEFAULT_DURATION_MS = 4000;

const TONE_ICON = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, { tone = 'info', duration = DEFAULT_DURATION_MS } = {}) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, tone }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  // toast.success('Saved') / toast.error('Failed') read better at call
  // sites than show(msg, { tone: 'success' }) everywhere - both are kept
  // since a couple of callers want a custom duration too.
  const toast = useCallback(
    (message, opts) => show(message, opts),
    [show]
  );
  toast.success = useCallback((message, opts) => show(message, { ...opts, tone: 'success' }), [show]);
  toast.error = useCallback((message, opts) => show(message, { ...opts, tone: 'error' }), [show]);
  toast.info = useCallback((message, opts) => show(message, { ...opts, tone: 'info' }), [show]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={styles.stack} role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = TONE_ICON[t.tone] || Info;
          return (
            <div key={t.id} className={`${styles.toast} ${styles[t.tone] || ''}`}>
              <Icon size={18} className={styles.toastIcon} aria-hidden="true" />
              <span className={styles.toastMessage}>{t.message}</span>
              <button type="button" className={styles.toastDismiss} onClick={() => dismiss(t.id)} aria-label="Dismiss">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast() must be used within a ToastProvider');
  return ctx;
}
