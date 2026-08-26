import { useEffect, useState } from 'react';
import * as analyticsApi from '../api/analytics.js';
import * as appointmentsApi from '../api/appointments.js';
import * as paymentsApi from '../api/payments.js';
import { ApiError } from '../api/client.js';
import { useSlowLoad } from '../hooks/useSlowLoad.js';
import { StatCard } from '../components/StatCard.jsx';
import styles from './OverviewPage.module.css';

const CARDS = [
  { key: 'bookingsToday', label: 'Bookings today', icon: '📅', tone: 'blue' },
  { key: 'upcomingCount', label: 'Upcoming', icon: '⏳', tone: 'aqua' },
  { key: 'revenueToday', label: 'Revenue today', icon: '💰', tone: 'green', money: true },
  { key: 'revenueWeek', label: 'Revenue (week)', icon: '📈', tone: 'violet', money: true },
  { key: 'revenueMonth', label: 'Revenue (month)', icon: '📊', tone: 'orange', money: true },
  { key: 'cancellationsToday', label: 'Cancellations', icon: '❌', tone: 'red' },
  { key: 'noShowsToday', label: 'No-shows', icon: '🚫', tone: 'magenta' },
  { key: 'unpaidCount', label: 'Unpaid bookings', icon: '⚠️', tone: 'yellow' },
];

function formatMoney(amount) {
  return `R${Number(amount || 0).toFixed(2)}`;
}

export function OverviewPage() {
  const [overview, setOverview] = useState(null);
  const [unpaid, setUnpaid] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rowError, setRowError] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const slowLoad = useSlowLoad(loading);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, unpaidList] = await Promise.all([analyticsApi.getOverview(), analyticsApi.getUnpaidAppointments()]);
      setOverview(overviewData);
      setUnpaid(unpaidList);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load overview.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCancel(appointment) {
    if (!window.confirm(`Cancel the appointment for ${appointment.customerId?.name || 'this customer'}?`)) return;
    setRowError(null);
    try {
      await appointmentsApi.cancelAppointment(appointment._id);
      await load();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : 'Failed to cancel appointment.');
    }
  }

  function startMarkPaid(appointment) {
    setPayingId(appointment._id);
    setPayAmount(String(appointment.priceSnapshot));
    setRowError(null);
  }

  async function submitMarkPaid(appointment) {
    setSubmitting(true);
    setRowError(null);
    try {
      await paymentsApi.recordPayment(appointment._id, { amount: Number(payAmount), method: 'cash', provider: 'cash' });
      setPayingId(null);
      await load();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="muted">{slowLoad ? 'Waking up the server — this can take a few seconds…' : 'Loading…'}</p>;
  }

  if (error) {
    return <p className="error-text">{error}</p>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Overview</h1>
      </div>

      <div className={styles.grid}>
        {CARDS.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            icon={card.icon}
            tone={card.tone}
            value={card.money ? formatMoney(overview[card.key]) : overview[card.key]}
          />
        ))}
      </div>

      <section className={`card ${styles.unpaidCard}`}>
        <h2 style={{ marginTop: 0 }}>Unpaid appointments — review required</h2>
        <p className="muted" style={{ marginTop: -8 }}>
          These bookings are confirmed or completed, but no payment has been recorded yet.
        </p>

        {rowError && <p className="error-text">{rowError}</p>}

        {unpaid.length === 0 ? (
          <p className="empty-state">Nothing to review — every booking is paid up.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Date &amp; time</th>
                <th>Service(s)</th>
                <th>Staff</th>
                <th>Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {unpaid.map((appointment) => (
                <tr key={appointment._id}>
                  <td>{appointment.customerId?.name || '—'}</td>
                  <td>{new Date(appointment.startTime).toLocaleString()}</td>
                  <td className="muted">{appointment.serviceIds?.map((s) => s.name).join(', ') || '—'}</td>
                  <td>{appointment.staffMemberId?.name || '—'}</td>
                  <td>{formatMoney(appointment.priceSnapshot)}</td>
                  <td>
                    {payingId === appointment._id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="input"
                          style={{ width: 90 }}
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                        />
                        <button type="button" className="btn btn-sm btn-primary" disabled={submitting} onClick={() => submitMarkPaid(appointment)}>
                          {submitting ? 'Saving…' : 'Save'}
                        </button>
                        <button type="button" className="btn btn-sm" onClick={() => setPayingId(null)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-sm" onClick={() => startMarkPaid(appointment)}>
                          Mark as paid
                        </button>
                        <button type="button" className="btn btn-sm btn-danger" onClick={() => handleCancel(appointment)}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
