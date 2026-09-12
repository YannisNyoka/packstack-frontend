import { useState } from 'react';
import { X } from 'lucide-react';
import * as staffApi from '../api/staff.js';
import { useToast } from './toast/ToastContext.jsx';
import { ApiError } from '../api/client.js';
import styles from './WorkingHoursModal.module.css';

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

/**
 * workingHours stores an array of {start,end} ranges per day (StaffMember.js -
 * split shifts are a real thing salons use), but this quick editor only shows
 * one range per day plus an on/off checkbox, matching the simpler common case.
 * Any second-or-later range a day already has (set via StaffPage's fuller
 * editor) is preserved untouched rather than silently dropped on save.
 */
function toForm(workingHours) {
  const form = {};
  for (const { key } of DAYS) {
    const ranges = workingHours?.[key] || [];
    form[key] = {
      enabled: ranges.length > 0,
      start: ranges[0]?.start || '09:00',
      end: ranges[0]?.end || '17:00',
      extraRanges: ranges.slice(1),
    };
  }
  return form;
}

function toPayload(form) {
  const payload = {};
  for (const { key } of DAYS) {
    const day = form[key];
    payload[key] = day.enabled ? [{ start: day.start, end: day.end }, ...day.extraRanges] : [];
  }
  return payload;
}

export function WorkingHoursModal({ staffMember, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(() => toForm(staffMember.workingHours));
  const [saving, setSaving] = useState(false);

  function updateDay(key, patch) {
    setForm((f) => ({ ...f, [key]: { ...f[key], ...patch } }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await staffApi.updateStaffMember(staffMember._id, { workingHours: toPayload(form) });
      toast.success(`${staffMember.name}'s working hours updated.`);
      onSaved?.(updated);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save working hours.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className={styles.modal} onSubmit={handleSave} role="dialog" aria-modal="true" aria-label={`Working hours for ${staffMember.name}`}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>
              <span aria-hidden="true">⏰</span> Working Hours — {staffMember.name}
            </h2>
            <p className={styles.subtitle}>Set regular working schedule</p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {DAYS.map(({ key, label }) => {
            const day = form[key];
            return (
              <div key={key} className={styles.row}>
                <span className={styles.dayLabel}>{label}</span>
                <input
                  type="time"
                  className="input"
                  value={day.start}
                  disabled={!day.enabled}
                  onChange={(e) => updateDay(key, { start: e.target.value })}
                  aria-label={`${label} start time`}
                />
                <input
                  type="time"
                  className="input"
                  value={day.end}
                  disabled={!day.enabled}
                  onChange={(e) => updateDay(key, { end: e.target.value })}
                  aria-label={`${label} end time`}
                />
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={(e) => updateDay(key, { enabled: e.target.checked })}
                  aria-label={`${label} working`}
                />
              </div>
            );
          })}
        </div>

        <div className={styles.footer}>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Hours'}
          </button>
        </div>
      </form>
    </div>
  );
}
