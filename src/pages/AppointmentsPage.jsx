import { Fragment, useEffect, useState } from 'react';
import * as appointmentsApi from '../api/appointments.js';
import * as staffApi from '../api/staff.js';
import * as servicesApi from '../api/services.js';
import * as paymentsApi from '../api/payments.js';
import { ApiError } from '../api/client.js';

const STATUS_FILTERS = ['all', 'booked', 'confirmed', 'completed', 'cancelled', 'no_show'];
const STATUS_LABEL = { booked: 'Booked', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No-show' };
const STATUS_BADGE = {
  booked: 'badge-neutral',
  confirmed: 'badge-success',
  completed: 'badge-success',
  cancelled: 'badge-danger',
  no_show: 'badge-warning',
};
const FINAL_STATUSES = ['cancelled', 'completed', 'no_show'];

const PAYMENT_STATUS_LABEL = { unpaid: 'Unpaid', paid_cash: 'Paid (cash)', paid_card: 'Paid (card)', paid_online: 'Paid (online)' };
const PAYMENT_STATUS_BADGE = { unpaid: 'badge-warning', paid_cash: 'badge-success', paid_card: 'badge-success', paid_online: 'badge-success' };
const PAYMENT_RECORD_BADGE = { pending: 'badge-neutral', succeeded: 'badge-success', failed: 'badge-danger', refunded: 'badge-warning' };

const emptyPaymentForm = { amount: '', method: 'cash', provider: 'cash', providerTransactionId: '' };

const emptyForm = { staffMemberId: '', serviceIds: [], startTime: '', phone: '', name: '', email: '', notes: '' };

function toDatetimeLocal(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [reschedulingId, setReschedulingId] = useState(null);
  const [rescheduleValue, setRescheduleValue] = useState('');
  const [rowError, setRowError] = useState(null);

  const [paymentsAppointmentId, setPaymentsAppointmentId] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState(null);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [recordingPayment, setRecordingPayment] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [appointmentList, staffList, serviceList] = await Promise.all([
        appointmentsApi.listAppointments(statusFilter === 'all' ? {} : { status: statusFilter }),
        staffApi.listStaff(),
        servicesApi.listServices(),
      ]);
      setAppointments(appointmentList);
      setStaff(staffList);
      setServices(serviceList);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  function toggleService(serviceId) {
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds.includes(serviceId) ? f.serviceIds.filter((id) => id !== serviceId) : [...f.serviceIds, serviceId],
    }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await appointmentsApi.createAppointment({
        staffMemberId: form.staffMemberId,
        serviceIds: form.serviceIds,
        startTime: new Date(form.startTime).toISOString(),
        customerDetails: { phone: form.phone, name: form.name, email: form.email || undefined },
        notes: form.notes || undefined,
      });
      setShowForm(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to create appointment.');
    } finally {
      setSaving(false);
    }
  }

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

  async function handleStatus(appointment, status) {
    setRowError(null);
    try {
      await appointmentsApi.updateAppointmentStatus(appointment._id, status);
      await load();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : 'Failed to update appointment.');
    }
  }

  function startReschedule(appointment) {
    setReschedulingId(appointment._id);
    setRescheduleValue(toDatetimeLocal(appointment.startTime));
    setRowError(null);
  }

  async function submitReschedule(appointment) {
    setRowError(null);
    try {
      await appointmentsApi.rescheduleAppointment(appointment._id, new Date(rescheduleValue).toISOString());
      setReschedulingId(null);
      await load();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : 'Failed to reschedule appointment.');
    }
  }

  async function togglePayments(appointment) {
    setReschedulingId(null);
    if (paymentsAppointmentId === appointment._id) {
      setPaymentsAppointmentId(null);
      return;
    }
    setPaymentsAppointmentId(appointment._id);
    setPaymentForm({ ...emptyPaymentForm, amount: String(appointment.priceSnapshot) });
    setPaymentsError(null);
    setPaymentsLoading(true);
    try {
      setPayments(await paymentsApi.listPayments(appointment._id));
    } catch (err) {
      setPaymentsError(err instanceof ApiError ? err.message : 'Failed to load payments.');
    } finally {
      setPaymentsLoading(false);
    }
  }

  async function handleRecordPayment(e, appointment) {
    e.preventDefault();
    setRecordingPayment(true);
    setPaymentsError(null);
    try {
      await paymentsApi.recordPayment(appointment._id, {
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        provider: paymentForm.provider,
        providerTransactionId: paymentForm.providerTransactionId || undefined,
      });
      setPaymentForm({ ...emptyPaymentForm, amount: String(appointment.priceSnapshot) });
      setPayments(await paymentsApi.listPayments(appointment._id));
      await load();
    } catch (err) {
      setPaymentsError(err instanceof ApiError ? err.message : 'Failed to record payment.');
    } finally {
      setRecordingPayment(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Appointments</h1>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
          New appointment
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All statuses' : STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="error-text">{error}</p>}
      {rowError && <p className="error-text">{rowError}</p>}

      {showForm && (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="apt-staff">Staff member</label>
              <select
                id="apt-staff"
                className="select"
                value={form.staffMemberId}
                onChange={(e) => setForm({ ...form, staffMemberId: e.target.value })}
                required
              >
                <option value="" disabled>
                  Select staff
                </option>
                {staff.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="apt-start">Start time</label>
              <input
                id="apt-start"
                type="datetime-local"
                className="input"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="field">
            <label>Services</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {services.map((service) => (
                <label key={service._id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
                  <input type="checkbox" checked={form.serviceIds.includes(service._id)} onChange={() => toggleService(service._id)} />
                  {service.name}
                </label>
              ))}
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="apt-name">Customer name</label>
              <input id="apt-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="apt-phone">Customer phone</label>
              <input id="apt-phone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="apt-email">Customer email (optional)</label>
              <input
                id="apt-email"
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="apt-notes">Notes (optional)</label>
            <textarea id="apt-notes" className="textarea" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          {formError && <p className="error-text">{formError}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving || form.serviceIds.length === 0}>
              {saving ? 'Booking…' : 'Book appointment'}
            </button>
            <button type="button" className="btn" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="card">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : appointments.length === 0 ? (
          <p className="empty-state">No appointments found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Customer</th>
                <th>Staff</th>
                <th>Services</th>
                <th>Status</th>
                <th>Payment</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <Fragment key={appointment._id}>
                <tr>
                  <td>
                    {reschedulingId === appointment._id ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          type="datetime-local"
                          className="input"
                          value={rescheduleValue}
                          onChange={(e) => setRescheduleValue(e.target.value)}
                        />
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => submitReschedule(appointment)}>
                          Save
                        </button>
                        <button type="button" className="btn btn-sm" onClick={() => setReschedulingId(null)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      new Date(appointment.startTime).toLocaleString()
                    )}
                  </td>
                  <td>{appointment.customerId?.name || '—'}</td>
                  <td>{appointment.staffMemberId?.name || '—'}</td>
                  <td className="muted">{appointment.serviceIds?.map((s) => s.name).join(', ') || '—'}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[appointment.status]}`}>{STATUS_LABEL[appointment.status]}</span>
                  </td>
                  <td>
                    <span className={`badge ${PAYMENT_STATUS_BADGE[appointment.paymentStatus]}`}>
                      {PAYMENT_STATUS_LABEL[appointment.paymentStatus]}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {!FINAL_STATUSES.includes(appointment.status) && (
                        <>
                          {appointment.status === 'booked' && (
                            <button type="button" className="btn btn-sm" onClick={() => handleStatus(appointment, 'confirmed')}>
                              Confirm
                            </button>
                          )}
                          <button type="button" className="btn btn-sm" onClick={() => handleStatus(appointment, 'completed')}>
                            Complete
                          </button>
                          <button type="button" className="btn btn-sm" onClick={() => handleStatus(appointment, 'no_show')}>
                            No-show
                          </button>
                          <button type="button" className="btn btn-sm" onClick={() => startReschedule(appointment)}>
                            Reschedule
                          </button>
                          <button type="button" className="btn btn-sm btn-danger" onClick={() => handleCancel(appointment)}>
                            Cancel
                          </button>
                        </>
                      )}
                      <button type="button" className="btn btn-sm" onClick={() => togglePayments(appointment)}>
                        Payments
                      </button>
                    </div>
                  </td>
                </tr>
                {paymentsAppointmentId === appointment._id && (
                  <tr>
                    <td colSpan={7}>
                      <div style={{ padding: '8px 0' }}>
                        {paymentsLoading ? (
                          <p className="muted">Loading…</p>
                        ) : (
                          <>
                            {payments.length === 0 ? (
                              <p className="muted" style={{ marginBottom: 12 }}>
                                No payments recorded yet for this appointment.
                              </p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                                {payments.map((payment) => (
                                  <div key={payment._id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                                    <span style={{ minWidth: 90 }}>R{payment.amount.toFixed(2)}</span>
                                    <span className="muted" style={{ minWidth: 100 }}>
                                      {payment.method} · {payment.provider}
                                    </span>
                                    <span className={`badge ${PAYMENT_RECORD_BADGE[payment.status] || 'badge-neutral'}`}>
                                      {payment.status}
                                    </span>
                                    <span className="muted" style={{ flex: 1 }}>
                                      {new Date(payment.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <form
                              onSubmit={(e) => handleRecordPayment(e, appointment)}
                              style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}
                            >
                              <div className="field" style={{ marginBottom: 0 }}>
                                <label htmlFor={`payment-amount-${appointment._id}`}>Amount (ZAR)</label>
                                <input
                                  id={`payment-amount-${appointment._id}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="input"
                                  style={{ width: 120 }}
                                  value={paymentForm.amount}
                                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="field" style={{ marginBottom: 0 }}>
                                <label htmlFor={`payment-method-${appointment._id}`}>Method</label>
                                <select
                                  id={`payment-method-${appointment._id}`}
                                  className="select"
                                  value={paymentForm.method}
                                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                                >
                                  <option value="cash">Cash</option>
                                  <option value="card">Card</option>
                                  <option value="online">Online</option>
                                </select>
                              </div>
                              <div className="field" style={{ marginBottom: 0 }}>
                                <label htmlFor={`payment-provider-${appointment._id}`}>Provider</label>
                                <select
                                  id={`payment-provider-${appointment._id}`}
                                  className="select"
                                  value={paymentForm.provider}
                                  onChange={(e) => setPaymentForm({ ...paymentForm, provider: e.target.value })}
                                >
                                  <option value="cash">Cash</option>
                                  <option value="yoco">Yoco</option>
                                  <option value="manual">Manual</option>
                                </select>
                              </div>
                              <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 160 }}>
                                <label htmlFor={`payment-ref-${appointment._id}`}>Reference (optional)</label>
                                <input
                                  id={`payment-ref-${appointment._id}`}
                                  className="input"
                                  value={paymentForm.providerTransactionId}
                                  onChange={(e) => setPaymentForm({ ...paymentForm, providerTransactionId: e.target.value })}
                                />
                              </div>
                              <button type="submit" className="btn btn-primary btn-sm" disabled={recordingPayment}>
                                {recordingPayment ? 'Saving…' : 'Record payment'}
                              </button>
                            </form>
                            {paymentsError && <p className="error-text">{paymentsError}</p>}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
