import { useEffect, useState } from 'react';
import * as plansApi from '../../api/platformPlans.js';
import { ApiError } from '../../api/client.js';

const emptyForm = {
  key: '',
  name: '',
  priceZAR: '',
  billingInterval: 'monthly',
  maxStaff: '',
  maxAppointmentsPerMonth: '',
  whatsappMessagesPerMonth: '',
  customDomainAllowed: false,
};

export function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setPlans(await plansApi.listPlans());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load plans.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await plansApi.createPlan({
        key: form.key,
        name: form.name,
        priceZAR: Number(form.priceZAR),
        billingInterval: form.billingInterval,
        limits: {
          maxStaff: Number(form.maxStaff),
          maxAppointmentsPerMonth: Number(form.maxAppointmentsPerMonth),
          whatsappMessagesPerMonth: Number(form.whatsappMessagesPerMonth),
          customDomainAllowed: form.customDomainAllowed,
        },
      });
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to create plan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Plans</h1>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add plan'}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {showForm && (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="plan-key">Key</label>
              <input id="plan-key" className="input" placeholder="starter" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="plan-name">Name</label>
              <input id="plan-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="plan-price">Price (ZAR)</label>
              <input
                id="plan-price"
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={form.priceZAR}
                onChange={(e) => setForm({ ...form, priceZAR: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="plan-interval">Billing interval</label>
              <select
                id="plan-interval"
                className="select"
                value={form.billingInterval}
                onChange={(e) => setForm({ ...form, billingInterval: e.target.value })}
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="plan-max-staff">Max staff</label>
              <input
                id="plan-max-staff"
                type="number"
                min="1"
                className="input"
                value={form.maxStaff}
                onChange={(e) => setForm({ ...form, maxStaff: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="plan-max-appointments">Max appointments/mo</label>
              <input
                id="plan-max-appointments"
                type="number"
                min="1"
                className="input"
                value={form.maxAppointmentsPerMonth}
                onChange={(e) => setForm({ ...form, maxAppointmentsPerMonth: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="plan-max-whatsapp">Max WhatsApp msgs/mo</label>
              <input
                id="plan-max-whatsapp"
                type="number"
                min="0"
                className="input"
                value={form.whatsappMessagesPerMonth}
                onChange={(e) => setForm({ ...form, whatsappMessagesPerMonth: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={form.customDomainAllowed}
                  onChange={(e) => setForm({ ...form, customDomainAllowed: e.target.checked })}
                />
                Custom domain allowed
              </label>
            </div>
          </div>
          {formError && <p className="error-text">{formError}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Add plan'}
            </button>
          </div>
        </form>
      )}

      <div className="card">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : plans.length === 0 ? (
          <p className="empty-state">No plans yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Name</th>
                <th>Price</th>
                <th>Limits</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan._id}>
                  <td>{plan.key}</td>
                  <td>{plan.name}</td>
                  <td>
                    R{plan.priceZAR.toFixed(2)} / {plan.billingInterval === 'annual' ? 'yr' : 'mo'}
                  </td>
                  <td className="muted">
                    {plan.limits.maxStaff} staff · {plan.limits.maxAppointmentsPerMonth} appts/mo · {plan.limits.whatsappMessagesPerMonth} WA/mo
                    {plan.limits.customDomainAllowed ? ' · custom domain' : ''}
                  </td>
                  <td>
                    <span className={`badge ${plan.active ? 'badge-success' : 'badge-neutral'}`}>{plan.active ? 'Active' : 'Inactive'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
