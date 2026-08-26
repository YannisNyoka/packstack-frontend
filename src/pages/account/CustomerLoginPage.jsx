import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../auth/CustomerAuthContext.jsx';
import * as bookingApi from '../../api/publicBooking.js';
import { ApiError } from '../../api/client.js';
import { AccountHeader } from '../../components/AccountHeader.jsx';
import styles from './CustomerAuthPages.module.css';

export function CustomerLoginPage() {
  const { login } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    bookingApi.getTheme().then(setTheme).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(phone, password);
      navigate(location.state?.from?.pathname || '/book', { replace: true });
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

        {location.state?.message && <p className={styles.contextMessage}>{location.state.message}</p>}

        <form className="card" onSubmit={handleSubmit}>
          <h2 className={styles.title}>Log in</h2>

          <div className="field">
            <label htmlFor="phone">Phone number</label>
            <input
              id="phone"
              type="tel"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
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
