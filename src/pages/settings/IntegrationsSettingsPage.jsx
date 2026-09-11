import { useEffect, useState } from 'react';
import * as integrationsApi from '../../api/integrations.js';
import { ApiError } from '../../api/client.js';
import { useSlowLoad } from '../../hooks/useSlowLoad.js';

// Yoco needs two separate credentials (a Checkout API secret key and a
// Developer Console API key - see integrationCredentialService.js), which
// isn't self-explanatory, so the connect form links out to a walkthrough
// rather than trying to explain Yoco's own dashboard inline.
const YOCO_GUIDE_URL = 'https://claude.ai/code/artifact/be949113-ec88-486e-a9eb-1f04f9bb9812';

function providerLabel(provider) {
  if (provider === 'wati') return 'WhatsApp (WATI)';
  if (provider === 'resend') return 'Email (Resend)';
  return 'Deposits (Yoco)';
}

export function IntegrationsSettingsPage() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const slowLoad = useSlowLoad(loading);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(null); // 'wati' | 'resend' | 'yoco' | null
  const [watiForm, setWatiForm] = useState({ accessToken: '', apiEndpoint: '' });
  const [resendForm, setResendForm] = useState({ apiKey: '', fromEmail: '' });
  const [yocoForm, setYocoForm] = useState({ secretKey: '', apiKey: '' });
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setCredentials(await integrationsApi.listIntegrations());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load integrations.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const byProvider = new Map(credentials.map((c) => [c.provider, c]));

  async function handleConnect(e, provider) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (provider === 'wati') {
        await integrationsApi.connectWati(watiForm);
        setWatiForm({ accessToken: '', apiEndpoint: '' });
      } else if (provider === 'resend') {
        await integrationsApi.connectResend(resendForm);
        setResendForm({ apiKey: '', fromEmail: '' });
      } else {
        await integrationsApi.connectYoco(yocoForm);
        setYocoForm({ secretKey: '', apiKey: '' });
      }
      setOpenForm(null);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to connect.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect(provider) {
    if (!window.confirm(`Disconnect ${providerLabel(provider)}? Notifications over this channel will stop.`)) return;
    try {
      await integrationsApi.disconnectIntegration(provider);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to disconnect.');
    }
  }

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Integrations</h2>
      <p className="muted" style={{ marginTop: -8 }}>
        Connect WhatsApp (WATI) and email (Resend) so booking confirmations go out automatically, and Yoco to take
        booking deposits online.
      </p>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p className="muted">{slowLoad ? 'Waking up the server — this can take a few seconds…' : 'Loading…'}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {['wati', 'resend', 'yoco'].map((provider) => {
            const credential = byProvider.get(provider);
            return (
              <div key={provider} style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <strong>{providerLabel(provider)}</strong>{' '}
                    {credential?.active ? (
                      <span className="badge badge-success">Connected · {credential.maskedHint}</span>
                    ) : (
                      <span className="badge badge-neutral">Not connected</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {credential?.active && (
                      <button type="button" className="btn btn-sm" onClick={() => handleDisconnect(provider)}>
                        Disconnect
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => {
                        setOpenForm(openForm === provider ? null : provider);
                        setFormError(null);
                      }}
                    >
                      {credential?.active ? 'Reconnect' : 'Connect'}
                    </button>
                  </div>
                </div>

                {openForm === provider && provider === 'wati' && (
                  <form className="form-grid" style={{ marginTop: 12 }} onSubmit={(e) => handleConnect(e, 'wati')}>
                    <div className="field">
                      <label htmlFor="wati-token">Access token</label>
                      <input
                        id="wati-token"
                        className="input"
                        value={watiForm.accessToken}
                        onChange={(e) => setWatiForm({ ...watiForm, accessToken: e.target.value })}
                        required
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="wati-endpoint">API endpoint</label>
                      <input
                        id="wati-endpoint"
                        type="url"
                        className="input"
                        placeholder="https://live-mt-server.wati.io/..."
                        value={watiForm.apiEndpoint}
                        onChange={(e) => setWatiForm({ ...watiForm, apiEndpoint: e.target.value })}
                        required
                      />
                    </div>
                    {formError && <p className="error-text">{formError}</p>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Connecting…' : 'Save'}
                      </button>
                      <button type="button" className="btn" onClick={() => setOpenForm(null)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {openForm === provider && provider === 'resend' && (
                  <form className="form-grid" style={{ marginTop: 12 }} onSubmit={(e) => handleConnect(e, 'resend')}>
                    <div className="field">
                      <label htmlFor="resend-key">API key</label>
                      <input
                        id="resend-key"
                        className="input"
                        value={resendForm.apiKey}
                        onChange={(e) => setResendForm({ ...resendForm, apiKey: e.target.value })}
                        required
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="resend-from">From email</label>
                      <input
                        id="resend-from"
                        type="email"
                        className="input"
                        value={resendForm.fromEmail}
                        onChange={(e) => setResendForm({ ...resendForm, fromEmail: e.target.value })}
                        required
                      />
                    </div>
                    {formError && <p className="error-text">{formError}</p>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Connecting…' : 'Save'}
                      </button>
                      <button type="button" className="btn" onClick={() => setOpenForm(null)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {openForm === provider && provider === 'yoco' && (
                  <form className="form-grid" style={{ marginTop: 12 }} onSubmit={(e) => handleConnect(e, 'yoco')}>
                    <p className="muted" style={{ gridColumn: '1 / -1', fontSize: 13, marginTop: 0 }}>
                      Two keys are needed - not sure where to find them?{' '}
                      <a href={YOCO_GUIDE_URL} target="_blank" rel="noopener noreferrer">
                        See the step-by-step guide
                      </a>
                      .
                    </p>
                    <div className="field">
                      <label htmlFor="yoco-secret">Secret key</label>
                      <input
                        id="yoco-secret"
                        className="input"
                        placeholder="sk_live_..."
                        value={yocoForm.secretKey}
                        onChange={(e) => setYocoForm({ ...yocoForm, secretKey: e.target.value })}
                        required
                      />
                      <p className="muted" style={{ fontSize: 12, marginTop: 4, marginBottom: 0 }}>
                        From the Checkout API page - takes payments.
                      </p>
                    </div>
                    <div className="field">
                      <label htmlFor="yoco-api-key">API key</label>
                      <input
                        id="yoco-api-key"
                        className="input"
                        placeholder="yoco_live_..."
                        value={yocoForm.apiKey}
                        onChange={(e) => setYocoForm({ ...yocoForm, apiKey: e.target.value })}
                        required
                      />
                      <p className="muted" style={{ fontSize: 12, marginTop: 4, marginBottom: 0 }}>
                        From a Developer Console application - registers the deposit webhook.
                      </p>
                    </div>
                    {formError && <p className="error-text">{formError}</p>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Connecting…' : 'Save'}
                      </button>
                      <button type="button" className="btn" onClick={() => setOpenForm(null)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
