import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../auth/CustomerAuthContext.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import * as bookingApi from '../../api/publicBooking.js';
import { ApiError } from '../../api/client.js';
import { AccountHeader } from '../../components/AccountHeader.jsx';
import styles from './CustomerAuthPages.module.css';

export function CustomerLoginPage() {
  const { login } = useCustomerAuth();
  const { login: dashboardLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    bookingApi.getTheme().then(setTheme).catch(() => {});
  }, []);

  // This is the only login form shown on the public site - there's no
  // separate, discoverable "owner/staff login" URL, since a labeled admin
  // entry point just invites credential-guessing attempts against it. A
  // tenant's own staff/owner sign in here exactly like a customer would.
  //
  // Dashboard credentials are tried FIRST, customer credentials as the
  // fallback - not the other way round. An owner can easily also hold a
  // customer account on their own site (e.g. from testing the booking
  // flow themselves); if that customer account happens to validate with
  // the same email/password, trying it first would silently strand the
  // owner on /book with no way to reach /dashboard from this form. Valid
  // owner/staff credentials should always win regardless of what else
  // that email/password also happens to satisfy.
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await dashboardLogin(email, password);
      navigate('/dashboard', { replace: true });
      return;
    } catch (err) {
      if (!(err instanceof ApiError)) {
        setError('Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }
    }

    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || '/book', { replace: true });
    } catch {
      // Never surface which system rejected the credentials or why (e.g.
      // "account locked") - that would let a stranger tell which emails
      // belong to owner/staff accounts just by watching for a different
      // message than a wrong customer password gets.
      setError('Invalid email or password.');
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

        {location.state?.message && <p className={styles.contextMessage}>{location.state.message}</p>}

        <form className="card" onSubmit={handleSubmit}>
          <h2 className={styles.title}>Log in</h2>

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

          <div className="field">
            <div className={styles.labelRow}>
              <label htmlFor="password">Password</label>
              <Link to="/account/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className={`btn btn-primary ${styles.submit}`} disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>

          <p className={styles.footer}>
            Don't have an account? <Link to="/account/signup" state={location.state}>Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
