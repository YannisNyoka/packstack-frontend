import { Fragment, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import * as staffApi from '../api/staff.js';
import * as servicesApi from '../api/services.js';
import * as timeOffApi from '../api/staffTimeOff.js';
import { ApiError } from '../api/client.js';

const emptyTimeOffForm = { date: '', allDay: true, startTime: '09:00', endTime: '17:00', reason: '' };

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

const emptyWorkingHours = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
const emptyForm = { name: '', servicesOffered: [], workingHours: emptyWorkingHours };

export function StaffPage() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [timeOffStaffId, setTimeOffStaffId] = useState(null);
  const [timeOffEntries, setTimeOffEntries] = useState([]);
  const [timeOffLoading, setTimeOffLoading] = useState(false);
  const [timeOffError, setTimeOffError] = useState(null);
  const [timeOffForm, setTimeOffForm] = useState(emptyTimeOffForm);
  const [timeOffSaving, setTimeOffSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [staffList, serviceList] = await Promise.all([
        staffApi.listStaff({ includeInactive: isOwner }),
        servicesApi.listServices({ includeInactive: true }),
      ]);
      setStaff(staffList);
      setServices(serviceList);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load staff.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
    setTimeOffStaffId(null);
  }

  function startEdit(member) {
    setEditingId(member._id);
    setForm({
      name: member.name,
      servicesOffered: member.servicesOffered.map(String),
      workingHours: { ...emptyWorkingHours, ...member.workingHours },
    });
    setFormError(null);
    setShowForm(true);
    setTimeOffStaffId(null);
  }

  function addRange(day) {
    setForm((f) => ({
      ...f,
      workingHours: { ...f.workingHours, [day]: [...f.workingHours[day], { start: '09:00', end: '17:00' }] },
    }));
  }

  function updateRange(day, index, field, value) {
    setForm((f) => ({
      ...f,
      workingHours: {
        ...f.workingHours,
        [day]: f.workingHours[day].map((range, i) => (i === index ? { ...range, [field]: value } : range)),
      },
    }));
  }

  function removeRange(day, index) {
    setForm((f) => ({
      ...f,
      workingHours: { ...f.workingHours, [day]: f.workingHours[day].filter((_, i) => i !== index) },
    }));
  }

  function toggleService(serviceId) {
    setForm((f) => ({
      ...f,
      servicesOffered: f.servicesOffered.includes(serviceId)
        ? f.servicesOffered.filter((id) => id !== serviceId)
        : [...f.servicesOffered, serviceId],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = { name: form.name, servicesOffered: form.servicesOffered, workingHours: form.workingHours };
      if (editingId) {
        await staffApi.updateStaffMember(editingId, payload);
      } else {
        await staffApi.createStaffMember(payload);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save staff member.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(member) {
    try {
      await staffApi.updateStaffMember(member._id, { active: !member.active });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update staff member.');
    }
  }

  async function openTimeOff(member) {
    setShowForm(false);
    if (timeOffStaffId === member._id) {
      setTimeOffStaffId(null);
      return;
    }
    setTimeOffStaffId(member._id);
    setTimeOffForm(emptyTimeOffForm);
    setTimeOffError(null);
    setTimeOffLoading(true);
    try {
      setTimeOffEntries(await timeOffApi.listTimeOff(member._id));
    } catch (err) {
      setTimeOffError(err instanceof ApiError ? err.message : 'Failed to load time off.');
    } finally {
      setTimeOffLoading(false);
    }
  }

  async function handleTimeOffSubmit(e) {
    e.preventDefault();
    setTimeOffSaving(true);
    setTimeOffError(null);
    try {
      await timeOffApi.createTimeOff(timeOffStaffId, {
        date: timeOffForm.date,
        startTime: timeOffForm.allDay ? null : timeOffForm.startTime,
        endTime: timeOffForm.allDay ? null : timeOffForm.endTime,
        reason: timeOffForm.reason,
      });
      setTimeOffForm(emptyTimeOffForm);
      setTimeOffEntries(await timeOffApi.listTimeOff(timeOffStaffId));
    } catch (err) {
      setTimeOffError(err instanceof ApiError ? err.message : 'Failed to add time off.');
    } finally {
      setTimeOffSaving(false);
    }
  }

  async function handleDeleteTimeOff(id) {
    try {
      await timeOffApi.deleteTimeOff(timeOffStaffId, id);
      setTimeOffEntries((entries) => entries.filter((e) => e._id !== id));
    } catch (err) {
      setTimeOffError(err instanceof ApiError ? err.message : 'Failed to remove time off.');
    }
  }

  const serviceNameById = new Map(services.map((s) => [s._id, s.name]));

  return (
    <div>
      <div className="page-header">
        <h1>Staff</h1>
        {isOwner && (
          <button type="button" className="btn btn-primary" onClick={startCreate}>
            Add staff member
          </button>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      {showForm && (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="staff-name">Name</label>
            <input id="staff-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div className="field">
            <label>Services offered</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {services.map((service) => (
                <label key={service._id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={form.servicesOffered.includes(service._id)}
                    onChange={() => toggleService(service._id)}
                  />
                  {service.name}
                </label>
              ))}
              {services.length === 0 && <span className="muted">Add a service first.</span>}
            </div>
          </div>

          <div className="field">
            <label>Working hours</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DAYS.map(({ key, label }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span className="muted" style={{ width: 36, paddingTop: 6, fontSize: 13 }}>
                    {label}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    {form.workingHours[key].map((range, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="time"
                          className="input"
                          style={{ width: 120 }}
                          value={range.start}
                          onChange={(e) => updateRange(key, index, 'start', e.target.value)}
                          required
                        />
                        <span className="muted">to</span>
                        <input
                          type="time"
                          className="input"
                          style={{ width: 120 }}
                          value={range.end}
                          onChange={(e) => updateRange(key, index, 'end', e.target.value)}
                          required
                        />
                        <button type="button" className="btn btn-sm" onClick={() => removeRange(key, index)}>
                          Remove
                        </button>
                      </div>
                    ))}
                    {form.workingHours[key].length === 0 && <span className="muted" style={{ fontSize: 13 }}>Day off</span>}
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ alignSelf: 'flex-start' }}
                      onClick={() => addRange(key)}
                    >
                      Add hours
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {formError && <p className="error-text">{formError}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add staff member'}
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
        ) : staff.length === 0 ? (
          <p className="empty-state">No staff members yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Services</th>
                <th>Status</th>
                {isOwner && <th />}
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <Fragment key={member._id}>
                  <tr>
                    <td>{member.name}</td>
                    <td className="muted">{member.servicesOffered.map((id) => serviceNameById.get(id) || id).join(', ') || '—'}</td>
                    <td>
                      <span className={`badge ${member.active ? 'badge-success' : 'badge-neutral'}`}>
                        {member.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {isOwner && (
                      <td style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-sm" onClick={() => startEdit(member)}>
                          Edit
                        </button>
                        <button type="button" className="btn btn-sm" onClick={() => openTimeOff(member)}>
                          Time off
                        </button>
                        <button type="button" className="btn btn-sm" onClick={() => toggleActive(member)}>
                          {member.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    )}
                  </tr>
                  {timeOffStaffId === member._id && (
                    <tr>
                      <td colSpan={4}>
                        <div style={{ padding: '8px 0' }}>
                          {timeOffLoading ? (
                            <p className="muted">Loading…</p>
                          ) : (
                            <>
                              {timeOffEntries.length === 0 ? (
                                <p className="muted" style={{ marginBottom: 12 }}>
                                  No upcoming time off for {member.name}.
                                </p>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                                  {timeOffEntries.map((entry) => (
                                    <div
                                      key={entry._id}
                                      style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}
                                    >
                                      <span style={{ minWidth: 100 }}>{entry.date}</span>
                                      <span className="muted" style={{ minWidth: 140 }}>
                                        {entry.startTime ? `${entry.startTime} - ${entry.endTime}` : 'All day'}
                                      </span>
                                      <span className="muted" style={{ flex: 1 }}>{entry.reason}</span>
                                      <button type="button" className="btn btn-sm" onClick={() => handleDeleteTimeOff(entry._id)}>
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <form
                                onSubmit={handleTimeOffSubmit}
                                style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}
                              >
                                <div className="field" style={{ marginBottom: 0 }}>
                                  <label htmlFor={`timeoff-date-${member._id}`}>Date</label>
                                  <input
                                    id={`timeoff-date-${member._id}`}
                                    type="date"
                                    className="input"
                                    value={timeOffForm.date}
                                    onChange={(e) => setTimeOffForm({ ...timeOffForm, date: e.target.value })}
                                    required
                                  />
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, paddingBottom: 8 }}>
                                  <input
                                    type="checkbox"
                                    checked={timeOffForm.allDay}
                                    onChange={(e) => setTimeOffForm({ ...timeOffForm, allDay: e.target.checked })}
                                  />
                                  All day
                                </label>
                                {!timeOffForm.allDay && (
                                  <>
                                    <div className="field" style={{ marginBottom: 0 }}>
                                      <label htmlFor={`timeoff-start-${member._id}`}>From</label>
                                      <input
                                        id={`timeoff-start-${member._id}`}
                                        type="time"
                                        className="input"
                                        style={{ width: 120 }}
                                        value={timeOffForm.startTime}
                                        onChange={(e) => setTimeOffForm({ ...timeOffForm, startTime: e.target.value })}
                                        required
                                      />
                                    </div>
                                    <div className="field" style={{ marginBottom: 0 }}>
                                      <label htmlFor={`timeoff-end-${member._id}`}>To</label>
                                      <input
                                        id={`timeoff-end-${member._id}`}
                                        type="time"
                                        className="input"
                                        style={{ width: 120 }}
                                        value={timeOffForm.endTime}
                                        onChange={(e) => setTimeOffForm({ ...timeOffForm, endTime: e.target.value })}
                                        required
                                      />
                                    </div>
                                  </>
                                )}
                                <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 160 }}>
                                  <label htmlFor={`timeoff-reason-${member._id}`}>Reason (optional)</label>
                                  <input
                                    id={`timeoff-reason-${member._id}`}
                                    className="input"
                                    value={timeOffForm.reason}
                                    onChange={(e) => setTimeOffForm({ ...timeOffForm, reason: e.target.value })}
                                  />
                                </div>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={timeOffSaving}>
                                  {timeOffSaving ? 'Adding…' : 'Add time off'}
                                </button>
                              </form>
                              {timeOffError && <p className="error-text">{timeOffError}</p>}
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
