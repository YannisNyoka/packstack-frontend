import { useEffect, useState } from 'react';
import * as tenantSettingsApi from '../../api/tenantSettings.js';
import { ApiError } from '../../api/client.js';
import { useSlowLoad } from '../../hooks/useSlowLoad.js';

export function DepositSettingsPage() {
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const slowLoad = useSlowLoad(loading);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ depositRequired: false, depositAmountZAR: '0' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await tenantSettingsApi.getBookingRules();
      setRules(data);
      setForm({ depositRequired: data.depositRequired, depositAmountZAR: String(data.depositAmountZAR) });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load deposit settings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const updated = await tenantSettingsApi.updateBookingRules({
        depositRequired: form.depositRequired,
        depositAmountZAR: Number(form.depositAmountZAR),
      });
      setRules(updated);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Failed to save deposit settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Deposits</h2>
      <p className="muted" style={{ marginTop: -8 }}>
        Require customers to pay a deposit via Yoco when they book online. Connect Yoco under Integrations first -
        this has no effect until you do.
      </p>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p className="muted">{slowLoad ? 'Waking up the server — this can take a few seconds…' : 'Loading…'}</p>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, paddingBottom: 8 }}>
            <input
              type="checkbox"
              checked={form.depositRequired}
              onChange={(e) => setForm({ ...form, depositRequired: e.target.checked })}
            />
            Require a deposit at booking
          </label>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="deposit-amount">Deposit amount (ZAR)</label>
            <input
              id="deposit-amount"
              type="number"
              min="0"
              step="0.01"
              className="input"
              style={{ width: 140 }}
              value={form.depositAmountZAR}
              onChange={(e) => setForm({ ...form, depositAmountZAR: e.target.value })}
              disabled={!form.depositRequired}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && <span className="muted">Saved.</span>}
        </form>
      )}
      {saveError && <p className="error-text">{saveError}</p>}
      {rules && !loading && (
        <p className="muted" style={{ marginTop: 12, marginBottom: 0 }}>
          {rules.depositRequired
            ? `Currently requiring a R${rules.depositAmountZAR.toFixed(2)} deposit (once Yoco is connected).`
            : 'No deposit is currently required.'}
        </p>
      )}
    </section>
  );
}
