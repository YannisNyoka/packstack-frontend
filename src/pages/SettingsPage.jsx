import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import * as integrationsApi from '../api/integrations.js';
import * as billingApi from '../api/billing.js';
import * as domainsApi from '../api/domains.js';
import * as tenantSettingsApi from '../api/tenantSettings.js';
import * as themeApi from '../api/theme.js';
import { getTenantSlug } from '../api/tenant.js';
import { ApiError } from '../api/client.js';

export function SettingsPage() {
  const { user } = useAuth();

  if (user?.role !== 'owner') {
    return (
      <div>
        <div className="page-header">
          <h1>Settings</h1>
        </div>
        <p className="empty-state">Only the business owner can view settings.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <BrandingSection />
        <IntegrationsSection />
        <DepositSection />
        <BillingSection />
        <DomainsSection />
      </div>
    </div>
  );
}

const SUBSCRIPTION_BADGE = {
  trialing: 'badge-neutral',
  active: 'badge-success',
  past_due: 'badge-warning',
  suspended: 'badge-danger',
  canceled: 'badge-neutral',
};

const emptyThemeForm = {
  businessName: '',
  tagline: '',
  logoUrl: '',
  bannerUrl: '',
  colors: { primary: '#111827', secondary: '#6B7280', accent: '#D946EF' },
  contactInfo: { phone: '', email: '', address: '' },
  socialLinks: { instagram: '', facebook: '', whatsapp: '' },
};

function BrandingSection() {
  const [form, setForm] = useState(emptyThemeForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(false);

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerUploadError, setBannerUploadError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const theme = await themeApi.getTheme();
      setForm({
        businessName: theme.businessName || '',
        tagline: theme.tagline || '',
        logoUrl: theme.logoUrl || '',
        bannerUrl: theme.bannerUrl || '',
        colors: { ...emptyThemeForm.colors, ...theme.colors },
        contactInfo: { ...emptyThemeForm.contactInfo, ...theme.contactInfo },
        socialLinks: { ...emptyThemeForm.socialLinks, ...theme.socialLinks },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load branding.');
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
      await themeApi.updateTheme(form);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Failed to save branding.');
    } finally {
      setSaving(false);
    }
  }

  function setColor(key, value) {
    setForm((f) => ({ ...f, colors: { ...f.colors, [key]: value } }));
  }

  function setContact(key, value) {
    setForm((f) => ({ ...f, contactInfo: { ...f.contactInfo, [key]: value } }));
  }

  function setSocial(key, value) {
    setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, [key]: value } }));
  }

  async function handleLogoFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setLogoUploading(true);
    setLogoUploadError(null);
    try {
      const theme = await themeApi.uploadLogo(file);
      setForm((f) => ({ ...f, logoUrl: theme.logoUrl || '' }));
    } catch (err) {
      setLogoUploadError(err instanceof ApiError ? err.message : 'Failed to upload logo.');
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleBannerFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBannerUploading(true);
    setBannerUploadError(null);
    try {
      const theme = await themeApi.uploadBanner(file);
      setForm((f) => ({ ...f, bannerUrl: theme.bannerUrl || '' }));
    } catch (err) {
      setBannerUploadError(err instanceof ApiError ? err.message : 'Failed to upload banner.');
    } finally {
      setBannerUploading(false);
    }
  }

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Branding</h2>
      <p className="muted" style={{ marginTop: -8 }}>
        Controls how your public booking page looks - business name, tagline, logo, colors and
        contact details. Upload an image directly, or paste a URL if it's already hosted
        somewhere.
      </p>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="theme-business-name">Business name</label>
              <input
                id="theme-business-name"
                className="input"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="theme-tagline">Tagline</label>
              <input
                id="theme-tagline"
                className="input"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="theme-logo">Logo URL</label>
              <input
                id="theme-logo"
                className="input"
                placeholder="https://…"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <input
                  id="theme-logo-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleLogoFile}
                  disabled={logoUploading}
                  style={{ fontSize: 13 }}
                />
                {logoUploading && <span className="muted" style={{ fontSize: 13 }}>Uploading…</span>}
              </div>
              {logoUploadError && <p className="error-text" style={{ fontSize: 13 }}>{logoUploadError}</p>}
            </div>
            <div className="field">
              <label htmlFor="theme-banner">Banner URL</label>
              <input
                id="theme-banner"
                className="input"
                placeholder="https://…"
                value={form.bannerUrl}
                onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <input
                  id="theme-banner-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleBannerFile}
                  disabled={bannerUploading}
                  style={{ fontSize: 13 }}
                />
                {bannerUploading && <span className="muted" style={{ fontSize: 13 }}>Uploading…</span>}
              </div>
              {bannerUploadError && <p className="error-text" style={{ fontSize: 13 }}>{bannerUploadError}</p>}
            </div>
          </div>
          {form.logoUrl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="muted" style={{ fontSize: 13 }}>
                Logo preview:
              </span>
              <img
                src={form.logoUrl}
                alt="Logo preview"
                style={{ height: 40, borderRadius: 6, border: '1px solid var(--color-border)' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Colors</label>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {['primary', 'secondary', 'accent'].map((key) => (
                <div key={key} className="field" style={{ marginBottom: 0 }}>
                  <label htmlFor={`theme-color-${key}`} style={{ textTransform: 'capitalize' }}>
                    {key}
                  </label>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={/^#([0-9a-fA-F]{6})$/.test(form.colors[key]) ? form.colors[key] : '#000000'}
                      onChange={(e) => setColor(key, e.target.value)}
                      style={{ width: 36, height: 36, padding: 0, border: '1px solid var(--color-border)', borderRadius: 6 }}
                    />
                    <input
                      id={`theme-color-${key}`}
                      className="input"
                      style={{ width: 100 }}
                      value={form.colors[key]}
                      onChange={(e) => setColor(key, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Contact info</label>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="theme-contact-phone">Phone</label>
                <input
                  id="theme-contact-phone"
                  className="input"
                  value={form.contactInfo.phone}
                  onChange={(e) => setContact('phone', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="theme-contact-email">Email</label>
                <input
                  id="theme-contact-email"
                  type="email"
                  className="input"
                  value={form.contactInfo.email}
                  onChange={(e) => setContact('email', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="theme-contact-address">Address</label>
                <input
                  id="theme-contact-address"
                  className="input"
                  value={form.contactInfo.address}
                  onChange={(e) => setContact('address', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Social links</label>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="theme-social-instagram">Instagram</label>
                <input
                  id="theme-social-instagram"
                  className="input"
                  placeholder="https://instagram.com/…"
                  value={form.socialLinks.instagram}
                  onChange={(e) => setSocial('instagram', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="theme-social-facebook">Facebook</label>
                <input
                  id="theme-social-facebook"
                  className="input"
                  placeholder="https://facebook.com/…"
                  value={form.socialLinks.facebook}
                  onChange={(e) => setSocial('facebook', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="theme-social-whatsapp">WhatsApp number</label>
                <input
                  id="theme-social-whatsapp"
                  className="input"
                  value={form.socialLinks.whatsapp}
                  onChange={(e) => setSocial('whatsapp', e.target.value)}
                />
              </div>
            </div>
          </div>

          {saveError && <p className="error-text">{saveError}</p>}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save branding'}
            </button>
            {saved && <span className="muted">Saved.</span>}
          </div>
        </form>
      )}
    </section>
  );
}

function IntegrationsSection() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(null); // 'wati' | 'resend' | 'yoco' | null
  const [watiForm, setWatiForm] = useState({ accessToken: '', apiEndpoint: '' });
  const [resendForm, setResendForm] = useState({ apiKey: '', fromEmail: '' });
  const [yocoForm, setYocoForm] = useState({ secretKey: '', webhookSecret: '' });
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
        setYocoForm({ secretKey: '', webhookSecret: '' });
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
        <p className="muted">Loading…</p>
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
                    </div>
                    <div className="field">
                      <label htmlFor="yoco-webhook-secret">Webhook secret</label>
                      <input
                        id="yoco-webhook-secret"
                        className="input"
                        placeholder="whsec_..."
                        value={yocoForm.webhookSecret}
                        onChange={(e) => setYocoForm({ ...yocoForm, webhookSecret: e.target.value })}
                        required
                      />
                    </div>
                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                      <label>Webhook URL (paste this into your Yoco dashboard)</label>
                      <input className="input" readOnly value={yocoWebhookUrl()} onFocus={(e) => e.target.select()} />
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

function providerLabel(provider) {
  if (provider === 'wati') return 'WhatsApp (WATI)';
  if (provider === 'resend') return 'Email (Resend)';
  return 'Deposits (Yoco)';
}

function yocoWebhookUrl() {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
  return `${apiBase}/api/t/${getTenantSlug()}/public/deposit-webhook`;
}

function DepositSection() {
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
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
        Require customers to pay a deposit via Yoco when they book online. Connect Yoco above first - this has no
        effect until you do.
      </p>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p className="muted">Loading…</p>
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

function BillingSection() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);
  const [checkingOutPlanId, setCheckingOutPlanId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [sub, planList] = await Promise.all([billingApi.getSubscription(), billingApi.listPlans()]);
      setSubscription(sub);
      setPlans(planList);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load billing info.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubscribe(planId) {
    setCheckingOutPlanId(planId);
    setCheckoutError(null);
    try {
      const { checkoutUrl, fields } = await billingApi.createCheckout(planId);
      redirectToPayfast(checkoutUrl, fields);
    } catch (err) {
      setCheckoutError(err instanceof ApiError ? err.message : 'Failed to start checkout.');
      setCheckingOutPlanId(null);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    setCancelError(null);
    try {
      await billingApi.cancelSubscription();
      await load();
    } catch (err) {
      setCancelError(err instanceof ApiError ? err.message : 'Failed to cancel subscription.');
    } finally {
      setCancelling(false);
    }
  }

  const currentPlanId = subscription?.planId?._id;

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Billing</h2>

      {error && <p className="error-text">{error}</p>}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          {subscription && (
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span>
                Current plan: <strong>{subscription.planId?.name}</strong>
              </span>
              <span className={`badge ${SUBSCRIPTION_BADGE[subscription.status] || 'badge-neutral'}`}>{subscription.status}</span>
              {subscription.currentPeriodEnd && (
                <span className="muted">renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
              )}
              {subscription.status === 'trialing' && (
                <button type="button" className="btn btn-sm btn-danger" disabled={cancelling} onClick={handleCancel}>
                  {cancelling ? 'Cancelling…' : 'Cancel subscription'}
                </button>
              )}
            </div>
          )}
          {!subscription && <p className="muted" style={{ marginTop: -8 }}>No active subscription yet - pick a plan below.</p>}

          {subscription?.status === 'canceled' && (
            <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
              Your subscription is cancelled - you won't be charged.
              {user?.trialEndsAt && ` You can keep using PackStack until your trial ends on ${new Date(user.trialEndsAt).toLocaleDateString()}.`}
            </p>
          )}

          {cancelError && <p className="error-text">{cancelError}</p>}
          {checkoutError && <p className="error-text">{checkoutError}</p>}

          {plans.length === 0 ? (
            <p className="empty-state">No plans are available yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {plans.map((plan) => (
                <div key={plan._id} className="card" style={{ boxShadow: 'none' }}>
                  <div style={{ fontWeight: 600 }}>{plan.name}</div>
                  <div className="muted" style={{ marginBottom: 8 }}>
                    R{plan.priceZAR.toFixed(2)} / {plan.billingInterval === 'annual' ? 'year' : 'month'}
                  </div>
                  <ul className="muted" style={{ fontSize: 13, paddingLeft: 18, marginBottom: 12 }}>
                    <li>{plan.limits.maxStaff} staff</li>
                    <li>{plan.limits.maxAppointmentsPerMonth} appointments/mo</li>
                    <li>{plan.limits.whatsappMessagesPerMonth} WhatsApp msgs/mo</li>
                    {plan.limits.customDomainAllowed && <li>Custom domain</li>}
                  </ul>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={checkingOutPlanId === plan._id || currentPlanId === plan._id}
                    onClick={() => handleSubscribe(plan._id)}
                  >
                    {currentPlanId === plan._id ? 'Current plan' : checkingOutPlanId === plan._id ? 'Redirecting…' : 'Subscribe'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

/** PayFast's hosted checkout expects a real form POST, not a fetch - build one and submit it. */
function redirectToPayfast(checkoutUrl, fields) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = checkoutUrl;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

function DomainsSection() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newDomain, setNewDomain] = useState('');
  const [addError, setAddError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState(null);
  const [pendingInstructions, setPendingInstructions] = useState(null); // { domain, dnsInstructions }

  async function load() {
    setLoading(true);
    try {
      setDomains(await domainsApi.listDomains());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load domains.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setAdding(true);
    setAddError(null);
    try {
      const result = await domainsApi.addDomain(newDomain);
      setPendingInstructions(result);
      setNewDomain('');
      await load();
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : 'Failed to add domain.');
    } finally {
      setAdding(false);
    }
  }

  async function handleVerify(domain) {
    setVerifyingDomain(domain);
    setError(null);
    try {
      await domainsApi.verifyDomain(domain);
      if (pendingInstructions?.domain === domain) setPendingInstructions(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verification failed.');
    } finally {
      setVerifyingDomain(null);
    }
  }

  async function handleRemove(domain) {
    if (!window.confirm(`Remove ${domain}? Visitors there will no longer reach your site.`)) return;
    try {
      await domainsApi.removeDomain(domain);
      if (pendingInstructions?.domain === domain) setPendingInstructions(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove domain.');
    }
  }

  return (
    <section className="card">
      <h2 style={{ marginTop: 0 }}>Custom domains</h2>
      <p className="muted" style={{ marginTop: -8 }}>
        Point your own domain at PackStack instead of using a packstack.co.za subdomain.
      </p>

      <form style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 16 }} onSubmit={handleAdd}>
        <div className="field" style={{ marginBottom: 0, flex: 1, maxWidth: 320 }}>
          <label htmlFor="new-domain">Domain</label>
          <input
            id="new-domain"
            className="input"
            placeholder="yourbusiness.co.za"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={adding}>
          {adding ? 'Adding…' : 'Add domain'}
        </button>
      </form>
      {addError && <p className="error-text">{addError}</p>}

      {pendingInstructions && (
        <div className="card" style={{ boxShadow: 'none', marginBottom: 16, background: 'var(--color-warning-bg)' }}>
          <p style={{ margin: '0 0 6px' }}>
            Add this TXT record to verify <strong>{pendingInstructions.domain}</strong>:
          </p>
          <code style={{ display: 'block', fontSize: 13 }}>
            {pendingInstructions.dnsInstructions.host} → {pendingInstructions.dnsInstructions.value}
          </code>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : domains.length === 0 ? (
        <p className="empty-state">No custom domains yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Domain</th>
              <th>Verification</th>
              <th>SSL</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {domains.map((mapping) => (
              <tr key={mapping._id}>
                <td>{mapping.domain}</td>
                <td>
                  <span className={`badge ${mapping.verified ? 'badge-success' : 'badge-warning'}`}>
                    {mapping.verified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${SSL_BADGE[mapping.sslStatus] || 'badge-neutral'}`}>{mapping.sslStatus}</span>
                </td>
                <td style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  {!mapping.verified && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={verifyingDomain === mapping.domain}
                      onClick={() => handleVerify(mapping.domain)}
                    >
                      {verifyingDomain === mapping.domain ? 'Checking…' : 'Verify'}
                    </button>
                  )}
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => handleRemove(mapping.domain)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

const SSL_BADGE = { pending: 'badge-neutral', issued: 'badge-success', failed: 'badge-danger' };
