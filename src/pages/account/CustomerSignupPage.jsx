import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../auth/CustomerAuthContext.jsx';
import * as bookingApi from '../../api/publicBooking.js';
import { ApiError } from '../../api/client.js';
import { AccountHeader } from '../../components/AccountHeader.jsx';
import styles from './CustomerAuthPages.module.css';

export function CustomerSignupPage() {
  const { signup } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
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
      await signup({ name, phone, email: email || undefined, password });
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

        {location.state?.message && <p className={styles.contextMessage}>{location.state.message}</p>}

        <form className="card" onSubmit={handleSubmit}>
        <h2 className={styles.title}>Sign up</h2>

        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

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
          <label htmlFor="email">Email (optional)</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
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
          <label htmlFor="confirm-password">Confirm password</label>
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

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className={`btn btn-primary ${styles.submit}`} disabled={submitting}>
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>

        <p className={styles.footer}>
          Already have an account? <Link to="/account/login" state={location.state}>Log in</Link>
        </p>
        </form>
      </div>
    </div>
  );
}
