import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, User, RotateCw, ChevronLeft, ChevronRight, Settings2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';
import * as appointmentsApi from '../api/appointments.js';
import * as staffApi from '../api/staff.js';
import { ApiError } from '../api/client.js';
import { useSlowLoad } from '../hooks/useSlowLoad.js';
import { WorkingHoursModal } from '../components/WorkingHoursModal.jsx';
import styles from './SchedulePage.module.css';

const ROW_HEIGHT = 56; // px per hour on the time axis
const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 20;
const MIN_BLOCK_HEIGHT = 26;

const STATUS_LABEL = { pending_payment: 'Pending payment', booked: 'Booked', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No-show' };
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Monday-anchored, matching how South African salons typically run their week. */
function startOfWeek(date) {
  const d = startOfDay(date);
  const isoDay = d.getDay() === 0 ? 7 : d.getDay(); // Sun=0 -> 7, so Mon is always day 1
  return addDays(d, 1 - isoDay);
}

function toDateInputValue(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatHourLabel(hour) {
  const h = hour % 24;
  const period = h < 12 ? 'AM' : 'PM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:00 ${period}`;
}

function formatTimeShort(date) {
  return new Date(date).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDayHeading(date) {
  return date.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Widens the default 07:00-20:00 window rather than clipping real data outside it. */
function computeHourRange(appointments) {
  let startHour = DEFAULT_START_HOUR;
  let endHour = DEFAULT_END_HOUR;
  for (const appt of appointments) {
    const s = new Date(appt.startTime);
    const e = new Date(appt.endTime);
    startHour = Math.min(startHour, s.getHours());
    const endHourForAppt = e.getMinutes() > 0 || e.getSeconds() > 0 ? e.getHours() + 1 : e.getHours();
    endHour = Math.max(endHour, endHourForAppt);
  }
  return { startHour, endHour: Math.max(endHour, startHour + 1) };
}

function blockStyle(appointment, startHour) {
  const start = new Date(appointment.startTime);
  const end = new Date(appointment.endTime);
  const minutesFromStart = (start.getHours() - startHour) * 60 + start.getMinutes();
  const durationMinutes = Math.max(15, (end - start) / 60000);
  return {
    top: `${(minutesFromStart / 60) * ROW_HEIGHT}px`,
    height: `${Math.max(MIN_BLOCK_HEIGHT, (durationMinutes / 60) * ROW_HEIGHT)}px`,
  };
}

function AppointmentBlock({ appointment }) {
  const isCancelled = appointment.status === 'cancelled';
  const isNoShow = appointment.status === 'no_show';
  return (
    <div
      className={`${styles.block} ${isCancelled ? styles.blockCancelled : ''} ${isNoShow ? styles.blockNoShow : ''}`}
      title={`${appointment.customerId?.name || 'Customer'} · ${formatTimeShort(appointment.startTime)}-${formatTimeShort(appointment.endTime)} · ${STATUS_LABEL[appointment.status] || appointment.status}`}
    >
      <span className={styles.blockTime}>{formatTimeShort(appointment.startTime)}</span>
      <span className={styles.blockName}>{appointment.customerId?.name || 'Customer'}</span>
      <span className={styles.blockServices}>{appointment.serviceIds?.map((s) => s.name).join(', ') || '—'}</span>
    </div>
  );
}

function TimeGridColumns({ startHour, endHour, columns }) {
  const hours = [];
  for (let h = startHour; h < endHour; h += 1) hours.push(h);
  const totalHeight = hours.length * ROW_HEIGHT;

  return (
    <div className={styles.gridScroll}>
      <div className={styles.grid} style={{ gridTemplateColumns: `72px repeat(${columns.length}, minmax(220px, 1fr))` }}>
        <div className={styles.timeColumn}>
          <div className={styles.columnHeaderSpacer} />
          <div className={styles.timeLabels} style={{ height: totalHeight }}>
            {hours.map((h) => (
              <div key={h} className={styles.timeLabel} style={{ height: ROW_HEIGHT }}>
                {formatHourLabel(h)}
              </div>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.key} className={styles.dataColumn}>
            <div className={styles.columnHeader}>{col.header}</div>
            <div className={styles.columnBody} style={{ height: totalHeight }}>
              {hours.map((h, i) => (
                <div key={h} className={styles.hourLine} style={{ top: i * ROW_HEIGHT }} />
              ))}
              {col.appointments.map((appt) => (
                <div key={appt._id} className={styles.blockWrap} style={blockStyle(appt, startHour)}>
                  <AppointmentBlock appointment={appt} />
                </div>
              ))}
              {col.appointments.length === 0 && <div className={styles.columnEmpty}>No appointments</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SchedulePage() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const [view, setView] = useState('daily'); // 'daily' | 'weekly'
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [staff, setStaff] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workingHoursStaff, setWorkingHoursStaff] = useState(null);
  const slowLoad = useSlowLoad(loading);

  useEffect(() => {
    staffApi.listStaff().then((list) => {
      setStaff(list);
      setSelectedStaffId((current) => current || list[0]?._id || null);
    }).catch(() => {});
  }, []);

  const range = useMemo(() => {
    if (view === 'daily') {
      return { from: startOfDay(selectedDate), to: endOfDay(selectedDate) };
    }
    const weekStart = startOfWeek(selectedDate);
    return { from: weekStart, to: endOfDay(addDays(weekStart, 6)) };
  }, [view, selectedDate]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = { from: range.from.toISOString(), to: range.to.toISOString() };
      if (view === 'weekly' && selectedStaffId) params.staffMemberId = selectedStaffId;
      const list = view === 'weekly' && !selectedStaffId ? [] : await appointmentsApi.listAppointments(params);
      setAppointments(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load the schedule.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, range.from.getTime(), range.to.getTime(), selectedStaffId]);

  function goToday() {
    setSelectedDate(startOfDay(new Date()));
  }

  function step(direction) {
    setSelectedDate((d) => addDays(d, view === 'daily' ? direction : direction * 7));
  }

  const { startHour, endHour } = useMemo(() => computeHourRange(appointments), [appointments]);

  const dailyColumns = useMemo(() => {
    return staff
      .filter((s) => s.active)
      .map((s) => {
        const staffAppointments = appointments.filter((a) => String(a.staffMemberId?._id || a.staffMemberId) === String(s._id));
        return {
          key: s._id,
          appointments: staffAppointments,
          header: (
            <div className={styles.staffHeader}>
              <span className={styles.staffAvatar}>{s.name.charAt(0).toUpperCase()}</span>
              <div className={styles.staffHeaderText}>
                <div className={styles.staffName}>{s.name}</div>
                <div className={styles.staffCount}>{staffAppointments.length} appts</div>
              </div>
              {isOwner && (
                <button
                  type="button"
                  className={styles.staffGear}
                  onClick={() => setWorkingHoursStaff(s)}
                  aria-label={`Set working hours for ${s.name}`}
                  title="Working hours"
                >
                  <Settings2 size={15} aria-hidden="true" />
                </button>
              )}
            </div>
          ),
        };
      });
  }, [staff, appointments, isOwner]);

  const weeklyColumns = useMemo(() => {
    const weekStart = startOfWeek(selectedDate);
    return Array.from({ length: 7 }).map((_, i) => {
      const day = addDays(weekStart, i);
      const dayAppointments = appointments.filter((a) => isSameDay(new Date(a.startTime), day));
      return {
        key: i,
        appointments: dayAppointments,
        header: (
          <div className={styles.dayHeader}>
            <div className={styles.dayName}>{DAY_LABELS[i]}</div>
            <div className={styles.dayDate}>{day.getDate()}</div>
          </div>
        ),
      };
    });
  }, [selectedDate, appointments]);

  const selectedStaffMember = staff.find((s) => s._id === selectedStaffId);

  return (
    <div>
      <div className="page-header">
        <h1>Schedule</h1>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={`${styles.viewBtn} ${view === 'daily' ? styles.viewBtnActive : ''}`}
            onClick={() => setView('daily')}
          >
            <CalendarDays size={16} aria-hidden="true" />
            Daily Overview
          </button>
          <button
            type="button"
            className={`${styles.viewBtn} ${view === 'weekly' ? styles.viewBtnActive : ''}`}
            onClick={() => setView('weekly')}
          >
            <User size={16} aria-hidden="true" />
            Per-Staff Weekly
          </button>
        </div>

        {view === 'weekly' && (
          <select className="select" value={selectedStaffId || ''} onChange={(e) => setSelectedStaffId(e.target.value)}>
            {staff.length === 0 && <option value="">No staff yet</option>}
            {staff.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        <div className={styles.dateNav}>
          <button type="button" className="btn btn-sm" onClick={() => step(-1)} aria-label="Previous">
            <ChevronLeft size={15} />
          </button>
          <input
            type="date"
            className="input"
            style={{ width: 150 }}
            value={toDateInputValue(selectedDate)}
            onChange={(e) => e.target.value && setSelectedDate(startOfDay(new Date(`${e.target.value}T00:00:00`)))}
          />
          <button type="button" className="btn btn-sm" onClick={() => step(1)} aria-label="Next">
            <ChevronRight size={15} />
          </button>
          <span className={styles.rangeLabel}>
            {view === 'daily' ? formatDayHeading(selectedDate) : `Week of ${formatDayHeading(startOfWeek(selectedDate))}`}
          </span>
        </div>

        <div className={styles.toolbarActions}>
          <button type="button" className="btn btn-sm" onClick={goToday}>
            Today
          </button>
          <button type="button" className="btn btn-sm" onClick={load} aria-label="Refresh">
            <RotateCw size={14} />
          </button>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p className="muted" style={{ padding: 20 }}>
            {slowLoad ? 'Waking up the server — this can take a few seconds…' : 'Loading…'}
          </p>
        ) : view === 'daily' && dailyColumns.length === 0 ? (
          <p className="empty-state">No staff members yet - add one on the Staff page to see their schedule here.</p>
        ) : view === 'weekly' && !selectedStaffMember ? (
          <p className="empty-state">No staff members yet - add one on the Staff page to see their schedule here.</p>
        ) : (
          <TimeGridColumns startHour={startHour} endHour={endHour} columns={view === 'daily' ? dailyColumns : weeklyColumns} />
        )}
      </div>

      {workingHoursStaff && (
        <WorkingHoursModal
          staffMember={workingHoursStaff}
          onClose={() => setWorkingHoursStaff(null)}
          onSaved={(updated) => setStaff((list) => list.map((s) => (s._id === updated._id ? updated : s)))}
        />
      )}
    </div>
  );
}
