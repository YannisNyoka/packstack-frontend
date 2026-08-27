import { useEffect, useState } from 'react';
import * as themeApi from '../../api/theme.js';
import { ApiError } from '../../api/client.js';
import { useSlowLoad } from '../../hooks/useSlowLoad.js';
import { DevicePreview } from '../../components/DevicePreview.jsx';

const emptyThemeForm = {
  businessName: '',
  tagline: '',
  logoUrl: '',
  bannerUrl: '',
  heroMediaType: 'image',
  heroVideoUrl: '',
  heroVideoUrls: [],
  heroEnabled: true,
  heroBadgeText: '',
  colors: { primary: '#111827', secondary: '#6B7280', accent: '#D946EF' },
  contactInfo: { phone: '', email: '', address: '' },
  socialLinks: { instagram: '', facebook: '', whatsapp: '', tiktok: '', website: '' },
};

export function BrandingSettingsPage() {
  const [form, setForm] = useState(emptyThemeForm);
  const [loading, setLoading] = useState(true);
  const slowLoad = useSlowLoad(loading);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saved, setSaved] = useState(false);

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerUploadError, setBannerUploadError] = useState(null);
  const [heroVideoUploading, setHeroVideoUploading] = useState(false);
  const [heroVideoUploadError, setHeroVideoUploadError] = useState(null);
  const [previewDevice, setPreviewDevice] = useState('desktop');

  async function load() {
    setLoading(true);
    try {
      const theme = await themeApi.getTheme();
      setForm({
        businessName: theme.businessName || '',
        tagline: theme.tagline || '',
        logoUrl: theme.logoUrl || '',
        bannerUrl: theme.bannerUrl || '',
        heroMediaType: theme.heroMediaType || 'image',
        heroVideoUrl: theme.heroVideoUrl || '',
        heroVideoUrls: theme.heroVideoUrls || [],
        heroEnabled: theme.heroEnabled !== false,
        heroBadgeText: theme.heroBadgeText || '',
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

  async function handleHeroVideoFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setHeroVideoUploading(true);
    setHeroVideoUploadError(null);
    try {
      // Uploads take effect immediately (server appends and persists), same
      // as the logo/banner uploads above - unlike a removal below, which is
      // just a local form edit applied when "Save branding" is clicked.
      const theme = await themeApi.uploadHeroVideo(file);
      setForm((f) => ({ ...f, heroVideoUrls: theme.heroVideoUrls || [] }));
    } catch (err) {
      setHeroVideoUploadError(err instanceof ApiError ? err.message : 'Failed to upload video.');
    } finally {
      setHeroVideoUploading(false);
    }
  }

  function removeHeroVideo(index) {
    setForm((f) => ({ ...f, heroVideoUrls: f.heroVideoUrls.filter((_, i) => i !== index) }));
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
        <p className="muted">{slowLoad ? 'Waking up the server — this can take a few seconds…' : 'Loading…'}</p>
      ) : (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <form
          onSubmit={handleSave}
          style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: '1 1 380px', minWidth: 320 }}
        >
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
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Landing page hero</label>
            <p className="muted" style={{ marginTop: -4, marginBottom: 12, fontSize: 13 }}>
              Controls the full-width banner at the top of your landing page (packstack.co.za/&lt;yourslug&gt;) -
              the background image or video, the small badge text over it, and whether it shows at all.
            </p>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <input
                type="checkbox"
                checked={form.heroEnabled}
                onChange={(e) => setForm({ ...form, heroEnabled: e.target.checked })}
              />
              <span>Show the hero banner</span>
            </label>

            {form.heroEnabled && (
              <>
                <div className="field" style={{ maxWidth: 280 }}>
                  <label htmlFor="theme-hero-badge">Badge text (optional)</label>
                  <input
                    id="theme-hero-badge"
                    className="input"
                    placeholder="e.g. Dube, Soweto · Est. 2019"
                    value={form.heroBadgeText}
                    onChange={(e) => setForm({ ...form, heroBadgeText: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="radio"
                      name="heroMediaType"
                      checked={form.heroMediaType === 'image'}
                      onChange={() => setForm({ ...form, heroMediaType: 'image' })}
                    />
                    <span>Background image</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="radio"
                      name="heroMediaType"
                      checked={form.heroMediaType === 'video'}
                      onChange={() => setForm({ ...form, heroMediaType: 'video' })}
                    />
                    <span>Background video</span>
                  </label>
                </div>

                {form.heroMediaType === 'image' ? (
                  <p className="muted" style={{ fontSize: 13 }}>
                    Uses the Banner image above.
                  </p>
                ) : (
                  <div className="field" style={{ maxWidth: 420 }}>
                    <label htmlFor="theme-hero-video-file">Hero videos ({form.heroVideoUrls.length}/6)</label>
                    <p className="muted" style={{ fontSize: 12, marginTop: -2, marginBottom: 8 }}>
                      Short clips of your services - they rotate in the hero banner. Upload one at a
                      time.
                    </p>
                    {form.heroVideoUrls.length > 0 && (
                      <ul style={{ listStyle: 'none', margin: '0 0 10px', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {form.heroVideoUrls.map((url, i) => (
                          <li key={url + i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <video
                              src={url}
                              muted
                              style={{ width: 56, height: 36, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--color-border)', background: '#000' }}
                            />
                            <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {url}
                            </span>
                            <button type="button" className="btn" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => removeHeroVideo(i)}>
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        id="theme-hero-video-file"
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={handleHeroVideoFile}
                        disabled={heroVideoUploading || form.heroVideoUrls.length >= 6}
                        style={{ fontSize: 13 }}
                      />
                      {heroVideoUploading && <span className="muted" style={{ fontSize: 13 }}>Uploading…</span>}
                    </div>
                    <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                      MP4, WebM or MOV, up to 50MB each, up to 6 videos. Removals apply when you save.
                    </p>
                    {heroVideoUploadError && (
                      <p className="error-text" style={{ fontSize: 13 }}>
                        {heroVideoUploadError}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

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
              <div className="field">
                <label htmlFor="theme-social-tiktok">TikTok</label>
                <input
                  id="theme-social-tiktok"
                  className="input"
                  placeholder="https://tiktok.com/@…"
                  value={form.socialLinks.tiktok}
                  onChange={(e) => setSocial('tiktok', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="theme-social-website">Website</label>
                <input
                  id="theme-social-website"
                  className="input"
                  placeholder="https://…"
                  value={form.socialLinks.website}
                  onChange={(e) => setSocial('website', e.target.value)}
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

        <div style={{ position: 'sticky', top: 20, flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              Live preview
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className={`btn btn-sm ${previewDevice === 'desktop' ? 'btn-primary' : ''}`}
                onClick={() => setPreviewDevice('desktop')}
              >
                Desktop
              </button>
              <button
                type="button"
                className={`btn btn-sm ${previewDevice === 'mobile' ? 'btn-primary' : ''}`}
                onClick={() => setPreviewDevice('mobile')}
              >
                Mobile
              </button>
            </div>
          </div>
          {previewDevice === 'desktop' ? (
            <DevicePreview theme={form} deviceWidth={1440} deviceHeight={900} boxWidth={420} label="Desktop" />
          ) : (
            <DevicePreview theme={form} deviceWidth={390} deviceHeight={844} boxWidth={260} label="Mobile" rounded />
          )}
        </div>
        </div>
      )}
    </section>
  );
}
