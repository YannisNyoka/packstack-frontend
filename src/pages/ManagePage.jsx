import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as manageApi from '../api/appointmentManage.js';
import * as bookingApi from '../api/publicBooking.js';
import { ApiError } from '../api/client.js';
import styles from './BookingPage.module.css';

const FINAL_STATUSES = ['completed', 'cancelled', 'no_show'];
const STATUS_LABEL = {
  booked: 'Booked',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
};

export function ManagePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [appointment, setAppointment] = useState(null);
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [mode, setMode] = useState('view'); // 'view' | 'reschedule' | 'cancel'
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setAppointment(await manageApi.getAppointmentByToken(token));
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Failed to load this appointment.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      setLoadError('This link is missing its appointment token.');
      setLoading(false);
      return;
    }
    load();
    bookingApi.getTheme().then(setTheme).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
      await manageApi.rescheduleByToken(token, selectedSlot);
      setMode('view');
      await load();
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
      await manageApi.cancelByToken(token, reason || undefined);
      setMode('view');
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to cancel.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.wrap}>
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.wrap}>
        <p className="error-text">{loadError}</p>
      </div>
    );
  }

  const canModify = !FINAL_STATUSES.includes(appointment.status);
  const primaryColor = theme?.colors?.primary || '#111827';
  const accentColor = theme?.colors?.accent || primaryColor;

  return (
    <div
      className={styles.wrap}
      style={{ '--brand': primaryColor, '--color-primary': primaryColor, '--color-accent': accentColor }}
    >
      <header className={styles.header}>
        {theme?.logoUrl && <img src={theme.logoUrl} alt="" className={styles.logo} />}
        <h1>Your appointment</h1>
      </header>

      <div className="card">
        <div className={styles.summary}>
          <div>{appointment.serviceIds.map((s) => s.name).join(', ')}</div>
          <div className="muted">
            with {appointment.staffMemberId.name} · {new Date(appointment.startTime).toLocaleDateString()} at{' '}
            {formatTime(appointment.startTime)}
          </div>
          <div style={{ marginTop: 6 }}>
            <span className={`badge ${STATUS_BADGE[appointment.status] || 'badge-neutral'}`}>{STATUS_LABEL[appointment.status]}</span>
          </div>
        </div>

        {!canModify && mode === 'view' && (
          <p className="muted">This appointment is {STATUS_LABEL[appointment.status].toLowerCase()} and can no longer be changed.</p>
        )}

        {canModify && mode === 'view' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-primary" onClick={() => { setMode('reschedule'); setDate(''); setSlots([]); setSelectedSlot(null); setActionError(null); }}>
              Reschedule
            </button>
            <button type="button" className="btn btn-danger" onClick={() => { setMode('cancel'); setReason(''); setActionError(null); }}>
              Cancel appointment
            </button>
          </div>
        )}

        {mode === 'reschedule' && (
          <div style={{ marginTop: 16 }}>
            <h2 style={{ marginTop: 0, fontSize: 16 }}>Pick a new time</h2>
            <div className="field" style={{ maxWidth: 220 }}>
              <label htmlFor="reschedule-date">Date</label>
              <input
                id="reschedule-date"
                type="date"
                className="input"
                min={new Date().toISOString().slice(0, 10)}
                value={date}
                onChange={(e) => loadSlots(e.target.value)}
              />
            </div>

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
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="button" className="btn" onClick={() => setMode('view')} disabled={submitting}>
                Back
              </button>
              <button type="button" className="btn btn-primary" disabled={!selectedSlot || submitting} onClick={handleReschedule}>
                {submitting ? 'Saving…' : 'Confirm new time'}
              </button>
            </div>
          </div>
        )}

        {mode === 'cancel' && (
          <div style={{ marginTop: 16 }}>
            <h2 style={{ marginTop: 0, fontSize: 16 }}>Cancel this appointment?</h2>
            <div className="field">
              <label htmlFor="cancel-reason">Reason (optional)</label>
              <input id="cancel-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            {actionError && <p className="error-text">{actionError}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn" onClick={() => setMode('view')} disabled={submitting}>
                Keep appointment
              </button>
              <button type="button" className="btn btn-danger" disabled={submitting} onClick={handleCancel}>
                {submitting ? 'Cancelling…' : 'Confirm cancellation'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
