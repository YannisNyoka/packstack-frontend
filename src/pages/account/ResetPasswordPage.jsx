import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCustomerAuth } from '../../auth/CustomerAuthContext.jsx';
import * as bookingApi from '../../api/publicBooking.js';
import { ApiError } from '../../api/client.js';
import { AccountHeader } from '../../components/AccountHeader.jsx';
import styles from './CustomerAuthPages.module.css';

export function ResetPasswordPage() {
  const { resetPassword } = useCustomerAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [theme, setTheme] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    bookingApi.getTheme().then(setTheme).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword(token, password);
      navigate('/book', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const primaryColor = theme?.colors?.primary || '#111827';
  const accentColor = theme?.colors?.accent || primaryColor;

  return (
    <div
      className={styles.wrap}
      style={{ '--brand': primaryColor, '--color-primary': primaryColor, '--color-accent': accentColor }}
    >
      <div className={styles.inner}>
        <AccountHeader theme={theme} />

        <div className="card">
          <h2 className={styles.title}>Set a new password</h2>

          {!token ? (
            <>
              <p className="error-text">This link is missing its reset token.</p>
              <p className={styles.footer}>
                <Link to="/account/forgot-password">Request a new link</Link>
              </p>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="password">New password</label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="confirm-password">Confirm new password</label>
                <input
                  id="confirm-password"
                  type="password"
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              {error && (
                <>
                  <p className="error-text">{error}</p>
                  <p className={styles.footer}>
                    <Link to="/account/forgot-password">Request a new link</Link>
                  </p>
                </>
              )}

              <button type="submit" className={`btn btn-primary ${styles.submit}`} disabled={submitting}>
                {submitting ? 'Saving…' : 'Set new password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
