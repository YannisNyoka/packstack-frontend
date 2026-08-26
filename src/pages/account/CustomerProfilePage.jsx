import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCustomerAuth } from '../../auth/CustomerAuthContext.jsx';
import * as accountApi from '../../api/customerAccount.js';
import * as bookingApi from '../../api/publicBooking.js';
import { ApiError } from '../../api/client.js';
import { AccountHeader } from '../../components/AccountHeader.jsx';
import { Calendar } from '../../components/Calendar.jsx';
import styles from './CustomerProfilePage.module.css';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'history', label: 'History' },
  { key: 'loyalty', label: 'Loyalty Points' },
  { key: 'profile', label: 'Edit Profile' },
  { key: 'password', label: 'Password' },
];

const STATUS_LABEL = { booked: 'Booked', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No-show' };
const STATUS_BADGE = {
  booked: 'badge-neutral',
  confirmed: 'badge-success',
  completed: 'badge-success',
  cancelled: 'badge-danger',
  no_show: 'badge-danger',
};

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function AppointmentCard({ appointment, canManage, onChanged }) {
  const [action, setAction] = useState(null); // 'reschedule' | 'cancel' | null
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadSlots(chosenDate) {
    setDate(chosenDate);
    setSelectedSlot(null);
    setSlots([]);
    setSlotsError(null);
    if (!chosenDate) return;
    setSlotsLoading(true);
    try {
      const availability = await bookingApi.getAvailability({
        date: chosenDate,
        serviceIds: appointment.serviceIds.map((s) => s._id),
        staffMemberId: appointment.staffMemberId._id,
      });
      setSlots(availability.staff[0]?.slots || []);
    } catch (err) {
      setSlotsError(err instanceof ApiError ? err.message : 'Failed to load availability.');
    } finally {
      setSlotsLoading(false);
    }
  }

  async function handleReschedule() {
    setSubmitting(true);
    setActionError(null);
    try {
      await accountApi.rescheduleAppointment(appointment._id, selectedSlot);
      setAction(null);
      onChanged();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to reschedule.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    setSubmitting(true);
    setActionError(null);
    try {
      await accountApi.cancelAppointment(appointment._id, reason || undefined);
      setAction(null);
      onChanged();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to cancel.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`card ${styles.appointmentCard}`}>
      <div>{appointment.serviceIds.map((s) => s.name).join(', ')}</div>
      <div className="muted">
        with {appointment.staffMemberId.name} · {new Date(appointment.startTime).toLocaleDateString()} at {formatTime(appointment.startTime)}
      </div>
      <div style={{ marginTop: 6 }}>
        <span className={`badge ${STATUS_BADGE[appointment.status] || 'badge-neutral'}`}>{STATUS_LABEL[appointment.status]}</span>
      </div>

      {canManage && !action && (
        <div className={styles.cardActions}>
          <button type="button" className="btn btn-sm" onClick={() => { setAction('reschedule'); setDate(''); setSlots([]); setSelectedSlot(null); setActionError(null); }}>
            Reschedule
          </button>
          <button type="button" className="btn btn-sm btn-danger" onClick={() => { setAction('cancel'); setReason(''); setActionError(null); }}>
            Cancel
          </button>
        </div>
      )}

      {action === 'reschedule' && (
        <div className={styles.actionPanel}>
          <p className={styles.rescheduleLabel}>New date</p>
          <Calendar value={date} minDate={new Date().toISOString().slice(0, 10)} onChange={loadSlots} />

          {slotsError && <p className="error-text">{slotsError}</p>}
          {slotsLoading && <p className="muted">Loading times…</p>}
          {!slotsLoading && date && !slotsError && (
            slots.length === 0 ? (
              <p className="empty-state">No times available that day - try another date.</p>
            ) : (
              <div className={styles.slotGrid}>
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={`btn btn-sm ${slot === selectedSlot ? 'btn-primary' : ''}`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {formatTime(slot)}
                  </button>
                ))}
              </div>
            )
          )}

          {actionError && <p className="error-text">{actionError}</p>}
          <div className={styles.cardActions}>
            <button type="button" className="btn btn-sm" onClick={() => setAction(null)} disabled={submitting}>
              Back
            </button>
            <button type="button" className="btn btn-sm btn-primary" disabled={!selectedSlot || submitting} onClick={handleReschedule}>
              {submitting ? 'Saving…' : 'Confirm new time'}
            </button>
          </div>
        </div>
      )}

      {action === 'cancel' && (
        <div className={styles.actionPanel}>
          <div className="field">
            <label htmlFor={`reason-${appointment._id}`}>Reason (optional)</label>
            <input id={`reason-${appointment._id}`} className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          {actionError && <p className="error-text">{actionError}</p>}
          <div className={styles.cardActions}>
            <button type="button" className="btn btn-sm" onClick={() => setAction(null)} disabled={submitting}>
              Keep appointment
            </button>
            <button type="button" className="btn btn-sm btn-danger" disabled={submitting} onClick={handleCancel}>
              {submitting ? 'Cancelling…' : 'Confirm cancellation'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentsTab({ status }) {
  const [appointments, setAppointments] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setAppointments(await accountApi.listAppointments(status));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load appointments.');
    }
  }

  useEffect(() => {
    setAppointments(null);
    setError(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (error) return <p className="error-text">{error}</p>;
  if (!appointments) return <p className="muted">Loading…</p>;
  if (appointments.length === 0) {
    return <p className="empty-state">{status === 'upcoming' ? 'No upcoming appointments.' : 'No past appointments yet.'}</p>;
  }

  return (
    <div className={styles.appointmentList}>
      {appointments.map((appointment) => (
        <AppointmentCard key={appointment._id} appointment={appointment} canManage={status === 'upcoming'} onChanged={load} />
      ))}
    </div>
  );
}

function LoyaltyTab() {
  const [loyalty, setLoyalty] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    accountApi
      .getLoyalty()
      .then(setLoyalty)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load loyalty points.'));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!loyalty) return <p className="muted">Loading…</p>;

  return (
    <div>
      <div className={styles.loyaltyBalance}>
        <span className={styles.loyaltyNumber}>{loyalty.balance}</span>
        <span className="muted">points</span>
      </div>

      {loyalty.history.length === 0 ? (
        <p className="empty-state">No loyalty activity yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Reason</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {loyalty.history.map((entry) => (
              <tr key={entry._id}>
                <td>{new Date(entry.createdAt).toLocaleDateString()}</td>
                <td>{entry.reason.replace(/_/g, ' ')}</td>
                <td>{entry.pointsDelta > 0 ? `+${entry.pointsDelta}` : entry.pointsDelta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ProfileTab() {
  const { customer, setCustomer } = useCustomerAuth();
  const [name, setName] = useState(customer?.name || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await accountApi.updateProfile({ name, email });
      setCustomer(updated);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="profile-name">Name</label>
        <input id="profile-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="profile-phone">Phone number</label>
        <input id="profile-phone" className="input" value={customer?.phone || ''} disabled />
      </div>
      <div className="field">
        <label htmlFor="profile-email">Email</label>
        <input id="profile-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      {error && <p className="error-text">{error}</p>}
      {success && <p className="muted">Profile updated.</p>}
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

function PasswordTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await accountApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to change password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="current-password">Current password</label>
        <input
          id="current-password"
          type="password"
          className="input"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="new-password">New password</label>
        <input
          id="new-password"
          type="password"
          className="input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="confirm-new-password">Confirm new password</label>
        <input
          id="confirm-new-password"
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
      {success && <p className="muted">Password changed.</p>}
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? 'Saving…' : 'Change password'}
      </button>
    </form>
  );
}

export function CustomerProfilePage() {
  const { customer, logout } = useCustomerAuth();
  const [theme, setTheme] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    bookingApi.getTheme().then(setTheme).catch(() => {});
  }, []);

  const primaryColor = theme?.colors?.primary || '#111827';
  const accentColor = theme?.colors?.accent || primaryColor;

  return (
    <div
      className={styles.wrap}
      style={{ '--brand': primaryColor, '--color-primary': primaryColor, '--color-accent': accentColor }}
    >
      <div className={styles.inner}>
      <AccountHeader
        theme={theme}
        right={
          <>
            <Link to="/book">Book Now</Link>
            <button type="button" className="btn btn-sm" onClick={logout}>
              Log out
            </button>
          </>
        }
      />

      <p className={`muted ${styles.welcome}`}>Welcome back, {customer?.name}</p>

      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card">
        {activeTab === 'upcoming' && <AppointmentsTab status="upcoming" />}
        {activeTab === 'history' && <AppointmentsTab status="history" />}
        {activeTab === 'loyalty' && <LoyaltyTab />}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'password' && <PasswordTab />}
      </div>
      </div>
    </div>
  );
}
