import { useEffect, useState } from 'react';
import { CalendarDays, Clock, Wallet, TrendingUp, BarChart3, XCircle, Ban, AlertTriangle } from 'lucide-react';
import * as analyticsApi from '../api/analytics.js';
import * as appointmentsApi from '../api/appointments.js';
import * as paymentsApi from '../api/payments.js';
import { ApiError } from '../api/client.js';
import { useSlowLoad } from '../hooks/useSlowLoad.js';
import { useConfirm } from '../components/confirm/ConfirmContext.jsx';
import { useToast } from '../components/toast/ToastContext.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { SkeletonStatGrid, SkeletonTable } from '../components/Skeleton.jsx';
import styles from './OverviewPage.module.css';

const CARDS = [
  { key: 'bookingsToday', label: 'Bookings today', icon: CalendarDays, tone: 'blue' },
  { key: 'upcomingCount', label: 'Upcoming', icon: Clock, tone: 'aqua' },
  { key: 'revenueToday', label: 'Revenue today', icon: Wallet, tone: 'green', money: true },
  { key: 'revenueWeek', label: 'Revenue (week)', icon: TrendingUp, tone: 'violet', money: true },
  { key: 'revenueMonth', label: 'Revenue (month)', icon: BarChart3, tone: 'orange', money: true },
  { key: 'cancellationsToday', label: 'Cancellations', icon: XCircle, tone: 'red' },
  { key: 'noShowsToday', label: 'No-shows', icon: Ban, tone: 'magenta' },
  { key: 'unpaidCount', label: 'Unpaid bookings', icon: AlertTriangle, tone: 'yellow' },
];

function formatMoney(amount) {
  return `R${Number(amount || 0).toFixed(2)}`;
}

export function OverviewPage() {
  const confirm = useConfirm();
  const toast = useToast();
  const [overview, setOverview] = useState(null);
  const [unpaid, setUnpaid] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    const ok = await confirm(`Cancel the appointment for ${appointment.customerId?.name || 'this customer'}?`, {
      title: 'Cancel appointment',
      tone: 'danger',
      confirmLabel: 'Cancel appointment',
      cancelLabel: 'Keep it',
    });
    if (!ok) return;
    try {
      await appointmentsApi.cancelAppointment(appointment._id);
      toast.success('Appointment cancelled.');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to cancel appointment.');
    }
  }

  function startMarkPaid(appointment) {
    setPayingId(appointment._id);
    setPayAmount(String(appointment.priceSnapshot));
  }

  async function submitMarkPaid(appointment) {
    setSubmitting(true);
    try {
      await paymentsApi.recordPayment(appointment._id, { amount: Number(payAmount), method: 'cash', provider: 'cash' });
      setPayingId(null);
      toast.success('Payment recorded.');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>Overview</h1>
        </div>
        {slowLoad && <p className="muted">Waking up the server — this can take a few seconds…</p>}
        <SkeletonStatGrid count={8} />
        <div className="card">
          <SkeletonTable rows={4} cols={5} />
        </div>
      </div>
    );
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
