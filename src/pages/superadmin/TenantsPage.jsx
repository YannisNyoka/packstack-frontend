import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as tenantsApi from '../../api/platformTenants.js';
import { ApiError } from '../../api/client.js';

const emptyForm = { slug: '', displayName: '', ownerEmail: '', ownerPassword: '' };

const STATUS_BADGE = {
  trial: 'badge-neutral',
  active: 'badge-success',
  past_due: 'badge-warning',
  suspended: 'badge-danger',
};

export function TenantsPage() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setTenants(await tenantsApi.listTenants());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load tenants.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const visibleTenants = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tenants.filter((tenant) => {
      if (statusFilter !== 'all' && tenant.status !== statusFilter) return false;
      if (!q) return true;
      return tenant.slug.toLowerCase().includes(q) || tenant.displayName.toLowerCase().includes(q);
    });
  }, [tenants, search, statusFilter]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await tenantsApi.createTenant(form);
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to provision tenant.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Tenants</h1>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Provision tenant'}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {showForm && (
        <form className="card" style={{ marginBottom: 20 }} onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="tenant-slug">Subdomain slug</label>
              <input
                id="tenant-slug"
                className="input"
                placeholder="nxl"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="tenant-name">Business name</label>
              <input
                id="tenant-name"
                className="input"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="tenant-owner-email">Owner email</label>
              <input
                id="tenant-owner-email"
                type="email"
                className="input"
                value={form.ownerEmail}
                onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="tenant-owner-password">Owner password</label>
              <input
                id="tenant-owner-password"
                type="password"
                className="input"
                minLength={12}
                value={form.ownerPassword}
                onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })}
                required
              />
            </div>
          </div>
          {formError && <p className="error-text">{formError}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Provisioning…' : 'Provision tenant'}
            </button>
          </div>
        </form>
      )}

      <div className="card">
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ flex: '1 1 220px' }}
            placeholder="Search by slug or business name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="past_due">Past due</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {loading ? (
          <p className="muted">Loading…</p>
        ) : visibleTenants.length === 0 ? (
          <p className="empty-state">{tenants.length === 0 ? 'No tenants yet.' : 'No tenants match your search.'}</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Slug</th>
                <th>Business name</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {visibleTenants.map((tenant) => (
                <tr
                  key={tenant._id}
                  onClick={() => navigate(`/superadmin/tenants/${tenant._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{tenant.slug}</td>
                  <td>{tenant.displayName}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[tenant.status] || 'badge-neutral'}`}>{tenant.status}</span>
                  </td>
                  <td className="muted">{new Date(tenant.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
