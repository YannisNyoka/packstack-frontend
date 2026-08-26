import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerAuth } from '../../auth/CustomerAuthContext.jsx';
import * as bookingApi from '../../api/publicBooking.js';
import { ApiError } from '../../api/client.js';
import { AccountHeader } from '../../components/AccountHeader.jsx';
import styles from './CustomerAuthPages.module.css';

export function ForgotPasswordPage() {
  const { forgotPassword } = useCustomerAuth();
  const [theme, setTheme] = useState(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    bookingApi.getTheme().then(setTheme).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await forgotPassword(email);
      setSent(true);
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
          <h2 className={styles.title}>Reset your password</h2>

          {sent ? (
            <>
              <p>If an account exists for {email}, we've sent a link to reset the password. It expires in 30 minutes.</p>
              <p className={styles.footer}>
                <Link to="/account/login">Back to log in</Link>
              </p>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className={styles.formNote}>Enter the email you signed up with and we'll send you a reset link.</p>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              {error && <p className="error-text">{error}</p>}

              <button type="submit" className={`btn btn-primary ${styles.submit}`} disabled={submitting}>
                {submitting ? 'Sending…' : 'Send reset link'}
              </button>

              <p className={styles.footer}>
                <Link to="/account/login">Back to log in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
