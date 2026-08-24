import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import * as bookingApi from '../api/publicBooking.js';
import * as accountApi from '../api/customerAccount.js';
import { ApiError } from '../api/client.js';
import { useCustomerAuth } from '../auth/CustomerAuthContext.jsx';
import { AccountHeader } from '../components/AccountHeader.jsx';
import { Calendar } from '../components/Calendar.jsx';
import styles from './BookingPage.module.css';

const RETURN_STATUS = new URLSearchParams(window.location.search).get('depositSuccess')
  ? 'success'
  : new URLSearchParams(window.location.search).get('depositCancelled')
    ? 'cancelled'
    : new URLSearchParams(window.location.search).get('depositFailed')
      ? 'failed'
      : null;

export function BookingPage() {
  const { customer, booting: customerAuthBooting } = useCustomerAuth();
  const location = useLocation();
  const [theme, setTheme] = useState(null);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [depositConfig, setDepositConfig] = useState({ required: false, amountZAR: 0, requireCustomerAccount: true });
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState('services');
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [details, setDetails] = useState({ name: '', phone: '', email: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  useEffect(() => {
    if (RETURN_STATUS) {
      setLoading(false); // the post-Yoco-redirect screen doesn't need the booking data at all
      return;
    }
    (async () => {
      try {
        const [themeResult, servicesResult, staffResult, depositResult] = await Promise.all([
          bookingApi.getTheme(),
          bookingApi.listServices(),
          bookingApi.listStaff(),
          bookingApi.getDepositConfig(),
        ]);
        setTheme(themeResult);
        setServices(servicesResult);
        setStaff(staffResult);
        setDepositConfig(depositResult);
      } catch (err) {
        setLoadError(err instanceof ApiError ? err.message : 'This booking page is unavailable right now.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedServices = useMemo(
    () => services.filter((s) => selectedServiceIds.includes(s._id)),
    [services, selectedServiceIds]
  );
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  const eligibleStaff = useMemo(
    () => staff.filter((member) => selectedServiceIds.every((id) => member.servicesOffered.includes(id))),
    [staff, selectedServiceIds]
  );
  const selectedStaff = staff.find((s) => s._id === selectedStaffId) || null;

  function toggleService(serviceId) {
    setSelectedServiceIds((ids) => (ids.includes(serviceId) ? ids.filter((id) => id !== serviceId) : [...ids, serviceId]));
  }

  function goToStaffStep() {
    setSelectedStaffId(null);
    setStep('staff');
  }

  function chooseStaff(staffId) {
    setSelectedStaffId(staffId);
    setDate('');
    setSlots([]);
    setSelectedSlot(null);
    setStep('time');
  }

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
        serviceIds: selectedServiceIds,
        staffMemberId: selectedStaffId,
      });
      setSlots(availability.staff[0]?.slots || []);
    } catch (err) {
      setSlotsError(err instanceof ApiError ? err.message : 'Failed to load availability.');
    } finally {
      setSlotsLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    // Logged-in customers book through the authenticated endpoint (identity
    // comes from their token, no form fields needed); anonymous booking -
    // only reachable at all when the tenant allows it - still submits the
    // typed name/phone/email like before.
    const bookingData = customer
      ? { staffMemberId: selectedStaffId, serviceIds: selectedServiceIds, startTime: selectedSlot, notes: details.notes || undefined }
      : {
          staffMemberId: selectedStaffId,
          serviceIds: selectedServiceIds,
          startTime: selectedSlot,
          customerDetails: { name: details.name, phone: details.phone, email: details.email || undefined },
          notes: details.notes || undefined,
        };
    const api = customer ? accountApi : bookingApi;

    try {
      if (depositConfig.required) {
        const { checkoutUrl } = await api.createDepositCheckout(bookingData);
        window.location.href = checkoutUrl;
        return;
      }
      const appointment = await api.createAppointment(bookingData);
      setConfirmedAppointment(appointment);
      setStep('confirmation');
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Failed to book this appointment.');
    } finally {
      setSubmitting(false);
    }
  }

  const primaryColor = theme?.colors?.primary || '#111827';
  const accentColor = theme?.colors?.accent || primaryColor;
  const today = new Date().toISOString().slice(0, 10);

  if (loading || customerAuthBooting) {
    return (
      <div className={styles.wrap}>
        <div className={styles.inner}>
          <p className="muted">Loading…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.wrap}>
        <div className={styles.inner}>
          <p className="error-text">{loadError}</p>
        </div>
      </div>
    );
  }

  // Whether an account is required to book is a per-tenant setting
  // (Tenant.bookingRules.requireCustomerAccount) - not a hardcoded route
  // gate, so it's checked here once the setting has actually loaded. Skips
  // this for the post-Yoco-redirect screens (RETURN_STATUS below), since
  // reaching those already implies the customer got through checkout once.
  if (!RETURN_STATUS && depositConfig.requireCustomerAccount !== false && !customer) {
    return <Navigate to="/account/login" replace state={{ from: location }} />;
  }

  if (RETURN_STATUS) {
    return (
      <div className={styles.wrap}>
        <div className={styles.inner}>
          <div className="card">
            {RETURN_STATUS === 'success' ? (
              <>
                <h2 style={{ marginTop: 0 }}>Thanks for your payment!</h2>
                <p className="muted">We're confirming your booking now - you'll receive a confirmation shortly.</p>
              </>
            ) : (
              <>
                <h2 style={{ marginTop: 0 }}>Payment not completed</h2>
                <p className="muted">
                  Your payment {RETURN_STATUS === 'cancelled' ? 'was cancelled' : 'did not go through'}, so your slot
                  was not reserved. Please try booking again.
                </p>
                <a className="btn btn-primary" style={{ marginTop: 8 }} href="/book">
                  Book again
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.wrap}
      style={{ '--brand': primaryColor, '--color-primary': primaryColor, '--color-accent': accentColor }}
    >
      <div className={styles.inner}>
      <AccountHeader
        theme={theme}
        right={!customerAuthBooting && customer ? <Link to="/account">My Account</Link> : null}
      />

      {theme?.tagline && (
        <header className={styles.header}>
          <p className="muted">{theme.tagline}</p>
        </header>
      )}

      {step !== 'confirmation' && (
        <ol className={styles.steps}>
          {['services', 'staff', 'time', 'details'].map((s) => (
            <li key={s} className={s === step ? styles.stepActive : undefined}>
              {STEP_LABELS[s]}
            </li>
          ))}
        </ol>
      )}

      <div className="card">
        {step === 'services' && (
          <div>
            <h2 style={{ marginTop: 0 }}>Choose a service</h2>
            {services.length === 0 ? (
              <p className="empty-state">No services are available for booking right now.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {services.map((service) => (
                  <label key={service._id} className={styles.optionRow}>
                    <input type="checkbox" checked={selectedServiceIds.includes(service._id)} onChange={() => toggleService(service._id)} />
                    <span style={{ flex: 1 }}>{service.name}</span>
                    <span className="muted">
                      {service.durationMinutes} min · R{service.price.toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <button type="button" className="btn btn-primary" disabled={selectedServiceIds.length === 0} onClick={goToStaffStep}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'staff' && (
          <div>
            <h2 style={{ marginTop: 0 }}>Choose a staff member</h2>
            {eligibleStaff.length === 0 ? (
              <p className="empty-state">No staff members offer that combination of services.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {eligibleStaff.map((member) => (
                  <button
                    key={member._id}
                    type="button"
                    className={styles.optionRow}
                    onClick={() => chooseStaff(member._id)}
                  >
                    {member.photoUrl && <img src={member.photoUrl} alt="" className={styles.avatar} />}
                    <span>{member.name}</span>
                  </button>
                ))}
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <button type="button" className="btn" onClick={() => setStep('services')}>
                Back
              </button>
            </div>
          </div>
        )}

        {step === 'time' && (
          <div>
            <h2 style={{ marginTop: 0 }}>Pick a date and time</h2>
            <Calendar value={date} minDate={today} onChange={loadSlots} />

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

            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button type="button" className="btn" onClick={() => setStep('staff')}>
                Back
              </button>
              <button type="button" className="btn btn-primary" disabled={!selectedSlot} onClick={() => setStep('details')}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'details' && (
          <form onSubmit={handleSubmit}>
            <h2 style={{ marginTop: 0 }}>{customer ? 'Confirm your booking' : 'Your details'}</h2>

            <div className={styles.summary}>
              <div>{selectedServices.map((s) => s.name).join(', ')}</div>
              <div className="muted">
                with {selectedStaff?.name} · {date && new Date(selectedSlot).toLocaleDateString()} at {formatTime(selectedSlot)}
              </div>
              <div className="muted">
                {totalDuration} min · R{totalPrice.toFixed(2)}
              </div>
              {customer && (
                <div className="muted" style={{ marginTop: 6 }}>
                  Booking as {customer.name} · {customer.phone}
                </div>
              )}
              {depositConfig.required && (
                <div className="muted" style={{ marginTop: 6 }}>
                  A R{depositConfig.amountZAR.toFixed(2)} deposit is required to secure this booking - you'll be
                  taken to a secure payment page next.
                </div>
              )}
            </div>

            {!customer && (
              <>
                <div className="field">
                  <label htmlFor="booking-name">Name</label>
                  <input id="booking-name" className="input" value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} required />
                </div>
                <div className="field">
                  <label htmlFor="booking-phone">Phone</label>
                  <input id="booking-phone" className="input" value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} required />
                </div>
                <div className="field">
                  <label htmlFor="booking-email">Email (optional)</label>
                  <input id="booking-email" type="email" className="input" value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} />
                </div>
              </>
            )}
            <div className="field">
              <label htmlFor="booking-notes">Notes (optional)</label>
              <textarea id="booking-notes" className="textarea" rows={3} value={details.notes} onChange={(e) => setDetails({ ...details, notes: e.target.value })} />
            </div>

            {submitError && <p className="error-text">{submitError}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button type="button" className="btn" onClick={() => setStep('time')} disabled={submitting}>
                Back
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting
                  ? depositConfig.required
                    ? 'Redirecting to payment…'
                    : 'Booking…'
                  : depositConfig.required
                    ? 'Continue to payment'
                    : 'Confirm booking'}
              </button>
            </div>
          </form>
        )}

        {step === 'confirmation' && confirmedAppointment && (
          <div>
            <h2 style={{ marginTop: 0 }}>You're booked!</h2>
            <p>
              {selectedServices.map((s) => s.name).join(', ')} with {selectedStaff?.name}
              <br />
              {new Date(confirmedAppointment.startTime).toLocaleDateString()} at {formatTime(confirmedAppointment.startTime)}
            </p>
            <p className="muted">
              We've sent a confirmation to {customer ? customer.phone : details.phone}
              {(customer ? customer.email : details.email) ? ` and ${customer ? customer.email : details.email}` : ''}
              {customer ? ' - view or manage it anytime from ' : ' with a link to reschedule or cancel if you need to.'}
              {customer && (
                <Link to="/account" style={{ color: 'var(--brand, var(--color-accent))' }}>
                  My Account
                </Link>
              )}
              {customer && '.'}
            </p>
            <a
              className="btn"
              style={{ marginTop: 8 }}
              href={buildGoogleCalendarUrl({
                title: `${selectedServices.map((s) => s.name).join(', ')} at ${theme?.businessName || 'your appointment'}`,
                startTime: confirmedAppointment.startTime,
                endTime: confirmedAppointment.endTime,
                details: `With ${selectedStaff?.name}${details.notes ? ` — ${details.notes}` : ''}`,
                location: theme?.contactInfo?.address || '',
              })}
              target="_blank"
              rel="noopener noreferrer"
            >
              Add to Google Calendar
            </a>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

const STEP_LABELS = { services: 'Service', staff: 'Staff', time: 'Time', details: 'Details' };

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function buildGoogleCalendarUrl({ title, startTime, endTime, details, location }) {
  const toGoogleDate = (iso) => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toGoogleDate(startTime)}/${toGoogleDate(endTime)}`,
    details: details || '',
    location: location || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
