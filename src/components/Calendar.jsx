import { useState } from 'react';
import styles from './Calendar.module.css';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfDay(d) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Month-grid date picker (replaces a plain <input type="date">) used
 * anywhere a customer picks a booking/reschedule date - BookingPage,
 * ManagePage, and the profile page's reschedule panel. `value`/`onChange`
 * work in plain ISO date strings (YYYY-MM-DD), same contract the old
 * <input type="date"> had, so swapping it in is a drop-in change.
 */
export function Calendar({ value, onChange, minDate }) {
  const today = startOfDay(new Date());
  const min = minDate ? startOfDay(new Date(minDate)) : today;

  const initialMonth = value ? new Date(value) : today;
  const [viewYear, setViewYear] = useState(initialMonth.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialMonth.getMonth());

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function goPrevMonth() {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }

  function goNextMonth() {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }

  const monthLabel = firstOfMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const todayIso = toISODate(today);

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <button type="button" className={styles.navBtn} onClick={goPrevMonth} aria-label="Previous month">
          ‹
        </button>
        <span className={styles.monthLabel}>{monthLabel}</span>
        <button type="button" className={styles.navBtn} onClick={goNextMonth} aria-label="Next month">
          ›
        </button>
      </div>

      <div className={styles.weekdays}>
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className={styles.grid}>
        {cells.map((d, i) => {
          if (d === null) return <span key={`pad-${i}`} className={styles.pad} />;
          const cellDate = new Date(viewYear, viewMonth, d);
          const iso = toISODate(cellDate);
          const isPast = cellDate < min;
          const isSelected = value === iso;
          const isToday = todayIso === iso;

          return (
            <button
              key={iso}
              type="button"
              disabled={isPast}
              className={[styles.day, isSelected ? styles.selected : '', isToday && !isSelected ? styles.today : '']
                .join(' ')
                .trim()}
              onClick={() => onChange(iso)}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
