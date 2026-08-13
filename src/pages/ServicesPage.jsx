import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import * as servicesApi from '../api/services.js';
import { ApiError } from '../api/client.js';

const emptyForm = { name: '', durationMinutes: '', price: '', category: '' };

export function ServicesPage() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setServices(await servicesApi.listServices({ includeInactive: isOwner }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load services.');
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
  }

  function startEdit(service) {
    setEditingId(service._id);
    setForm({
      name: service.name,
      durationMinutes: String(service.durationMinutes),
      price: String(service.price),
      category: service.category || '',
    });
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name,
        durationMinutes: Number(form.durationMinutes),
        price: Number(form.price),
        category: form.category,
      };
      if (editingId) {
        await servicesApi.updateService(editingId, payload);
      } else {
        await servicesApi.createService(payload);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save service.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(service) {
    try {
      await servicesApi.setServiceActive(service._id, !service.active);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update service.');
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Services</h1>
        {isOwner && (
          <button type="button" className="btn btn-primary" onClick={startCreate}>
            Add service
          </button>
        )}
      </div>

      {error && <p className="error-text">{error}</p>}

      {showForm && (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="svc-name">Name</label>
              <input
                id="svc-name"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="svc-category">Category</label>
              <input id="svc-category" className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="svc-duration">Duration (minutes)</label>
              <input
                id="svc-duration"
                type="number"
                min="5"
                className="input"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="svc-price">Price</label>
              <input
                id="svc-price"
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>
          </div>
          {formError && <p className="error-text">{formError}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add service'}
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
        ) : services.length === 0 ? (
          <p className="empty-state">No services yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Status</th>
                {isOwner && <th />}
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service._id}>
                  <td>{service.name}</td>
                  <td className="muted">{service.category || '—'}</td>
                  <td>{service.durationMinutes} min</td>
                  <td>{service.price}</td>
                  <td>
                    <span className={`badge ${service.active ? 'badge-success' : 'badge-neutral'}`}>
                      {service.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {isOwner && (
                    <td style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-sm" onClick={() => startEdit(service)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-sm" onClick={() => toggleActive(service)}>
                        {service.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
