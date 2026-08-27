import { useEffect, useState } from 'react';
import * as tenantSettingsApi from '../../api/tenantSettings.js';
import { ApiError } from '../../api/client.js';
import { useSlowLoad } from '../../hooks/useSlowLoad.js';

export function BookingAccessSettingsPage() {
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const slowLoad = useSlowLoad(loading);
  const [error, setError] = useState(null);
  const [requireCustomerAccount, setRequireCustomerAccount] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await tenantSettingsApi.getBookingRules();
      setRules(data);
      setRequireCustomerAccount(data.requireCustomerAccount !== false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load booking access settings.');
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
      const updated = await tenantSettingsApi.updateBookingRules({ requireCustomerAccount });
      setRules(updated);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Booking access</h2>
      <p className="muted" style={{ marginTop: -8 }}>
        Controls whether a customer needs a PackStack account to book with you, or can book anonymously by just
        typing their name and phone number.
      </p>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p className="muted">{slowLoad ? 'Waking up the server — this can take a few seconds…' : 'Loading…'}</p>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={requireCustomerAccount}
              onChange={(e) => setRequireCustomerAccount(e.target.checked)}
            />
            Require an account to book
          </label>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saved && <span className="muted">Saved.</span>}
        </form>
      )}
      {saveError && <p className="error-text">{saveError}</p>}
      {rules && !loading && (
        <p className="muted" style={{ marginTop: 12, marginBottom: 0 }}>
          {rules.requireCustomerAccount !== false
            ? 'Customers must sign up or log in before they can book.'
            : 'Customers can book without an account (the classic name/phone/email flow).'}
        </p>
      )}
    </section>
  );
}
