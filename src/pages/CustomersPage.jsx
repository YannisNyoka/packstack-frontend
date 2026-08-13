import { Fragment, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import * as customersApi from '../api/customers.js';
import { ApiError } from '../api/client.js';

const emptyForm = { name: '', phone: '', email: '', notes: '' };
const emptyAdjustForm = { pointsDelta: '', reasonNote: '' };

export function CustomersPage() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [adjustingId, setAdjustingId] = useState(null);
  const [adjustForm, setAdjustForm] = useState(emptyAdjustForm);
  const [adjustError, setAdjustError] = useState(null);
  const [adjusting, setAdjusting] = useState(false);

  async function load(currentSearch) {
    setLoading(true);
    try {
      setCustomers(await customersApi.listCustomers({ search: currentSearch }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  }

  function startEdit(customer) {
    setAdjustingId(null);
    setEditingId(customer._id);
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      notes: customer.notes || '',
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
        phone: form.phone,
        email: form.email || null,
        notes: form.notes,
      };
      if (editingId) {
        await customersApi.updateCustomer(editingId, payload);
      } else {
        await customersApi.createCustomer(payload);
      }
      setShowForm(false);
      await load(search);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save customer.');
    } finally {
      setSaving(false);
    }
  }

  function startAdjust(customer) {
    setShowForm(false);
    setAdjustingId(customer._id);
    setAdjustForm(emptyAdjustForm);
    setAdjustError(null);
  }

  async function handleAdjustSubmit(e, customerId) {
    e.preventDefault();
    setAdjusting(true);
    setAdjustError(null);
    try {
      await customersApi.adjustLoyaltyPoints(customerId, {
        pointsDelta: Number(adjustForm.pointsDelta),
        reasonNote: adjustForm.reasonNote,
      });
      setAdjustingId(null);
      await load(search);
    } catch (err) {
      setAdjustError(err instanceof ApiError ? err.message : 'Failed to adjust points.');
    } finally {
      setAdjusting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Customers</h1>
        <button type="button" className="btn btn-primary" onClick={startCreate}>
          Add customer
        </button>
      </div>

      <div className="field" style={{ maxWidth: 320 }}>
        <input
          className="input"
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="error-text">{error}</p>}

      {showForm && (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="cust-name">Name</label>
              <input
                id="cust-name"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="cust-phone">Phone</label>
              <input
                id="cust-phone"
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="cust-email">Email</label>
              <input
                id="cust-email"
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="cust-notes">Notes</label>
            <textarea
              id="cust-notes"
              className="textarea"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          {formError && <p className="error-text">{formError}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add customer'}
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
        ) : customers.length === 0 ? (
          <p className="empty-state">{search ? 'No customers match your search.' : 'No customers yet.'}</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Loyalty points</th>
                <th>Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <Fragment key={customer._id}>
                  <tr>
                    <td>{customer.name}</td>
                    <td>{customer.phone}</td>
                    <td className="muted">{customer.email || '—'}</td>
                    <td>
                      <span className="badge badge-neutral">{customer.loyaltyPoints}</span>
                    </td>
                    <td className="muted">{customer.notes ? truncate(customer.notes, 40) : '—'}</td>
                    <td style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-sm" onClick={() => startEdit(customer)}>
                        Edit
                      </button>
                      {isOwner && (
                        <button type="button" className="btn btn-sm" onClick={() => startAdjust(customer)}>
                          Adjust points
                        </button>
                      )}
                    </td>
                  </tr>
                  {adjustingId === customer._id && (
                    <tr>
                      <td colSpan={6}>
                        <form
                          className="form-grid"
                          style={{ alignItems: 'end', margin: '4px 0' }}
                          onSubmit={(e) => handleAdjustSubmit(e, customer._id)}
                        >
                          <div className="field">
                            <label htmlFor={`adjust-delta-${customer._id}`}>Points delta</label>
                            <input
                              id={`adjust-delta-${customer._id}`}
                              type="number"
                              className="input"
                              placeholder="e.g. 10 or -5"
                              value={adjustForm.pointsDelta}
                              onChange={(e) => setAdjustForm({ ...adjustForm, pointsDelta: e.target.value })}
                              required
                            />
                          </div>
                          <div className="field">
                            <label htmlFor={`adjust-reason-${customer._id}`}>Reason</label>
                            <input
                              id={`adjust-reason-${customer._id}`}
                              className="input"
                              value={adjustForm.reasonNote}
                              onChange={(e) => setAdjustForm({ ...adjustForm, reasonNote: e.target.value })}
                            />
                          </div>
                          <div className="field" style={{ flexDirection: 'row', gap: 8 }}>
                            <button type="submit" className="btn btn-primary btn-sm" disabled={adjusting}>
                              {adjusting ? 'Saving…' : 'Save'}
                            </button>
                            <button type="button" className="btn btn-sm" onClick={() => setAdjustingId(null)}>
                              Cancel
                            </button>
                          </div>
                        </form>
                        {adjustError && <p className="error-text">{adjustError}</p>}
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

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
