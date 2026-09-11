import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import styles from './ConfirmDialog.module.css';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null); // { message, title, tone, confirmLabel, cancelLabel, resolve }
  const cancelRef = useRef(null);

  const confirm = useCallback((message, opts = {}) => {
    return new Promise((resolve) => {
      setRequest({
        message,
        title: opts.title || null,
        tone: opts.tone || 'default', // 'default' | 'danger'
        confirmLabel: opts.confirmLabel || 'Confirm',
        cancelLabel: opts.cancelLabel || 'Cancel',
        resolve,
      });
    });
  }, []);

  function settle(result) {
    request?.resolve(result);
    setRequest(null);
  }

  useEffect(() => {
    if (!request) return;
    cancelRef.current?.focus();
    function onKeyDown(e) {
      if (e.key === 'Escape') settle(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  const Icon = request?.tone === 'danger' ? AlertTriangle : HelpCircle;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && settle(false)}>
          <div className={styles.dialog} role="alertdialog" aria-modal="true" aria-label={request.title || 'Confirm'}>
            <div className={`${styles.iconWrap} ${request.tone === 'danger' ? styles.iconDanger : styles.iconDefault}`}>
              <Icon size={20} aria-hidden="true" />
            </div>
            <div className={styles.body}>
              {request.title && <h3 className={styles.title}>{request.title}</h3>}
              <p className={styles.message}>{request.message}</p>
            </div>
            <div className={styles.actions}>
              <button type="button" ref={cancelRef} className="btn" onClick={() => settle(false)}>
                {request.cancelLabel}
              </button>
              <button
                type="button"
                className={`btn ${request.tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => settle(true)}
              >
                {request.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

/** Drop-in async replacement for window.confirm(): `if (!(await confirm('Delete this?'))) return;` */
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm() must be used within a ConfirmProvider');
  return ctx;
}
