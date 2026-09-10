import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as tenantsApi from '../../api/platformTenants.js';
import { ApiError } from '../../api/client.js';

const STATUS_BADGE = {
  trial: 'badge-neutral',
  active: 'badge-success',
  past_due: 'badge-warning',
  suspended: 'badge-danger',
};

const SUBSCRIPTION_BADGE = {
  trialing: 'badge-neutral',
  active: 'badge-success',
  past_due: 'badge-warning',
  suspended: 'badge-danger',
  canceled: 'badge-neutral',
};

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : '—';
}

/** A field shown as plain text until "Edit" is clicked, then an input + Save/Cancel. */
function EditableField({ label, value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function startEdit() {
    setDraft(value);
    setError(null);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="field">
      <label>{label}</label>
      {editing ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <input className="input" value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
          <button type="button" className="btn btn-sm btn-primary" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="btn btn-sm" disabled={saving} onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>{value || '—'}</span>
          <button type="button" className="btn btn-sm" onClick={startEdit}>
            Edit
          </button>
        </div>
      )}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

export function TenantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusChoice, setStatusChoice] = useState('trial');
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState(null);

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await tenantsApi.getTenant(id);
      setTenant(data.tenant);
      setSubscription(data.subscription);
      setOwner(data.owner);
      setStatusChoice(data.tenant.status);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load tenant.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleStatusSave() {
    setStatusSaving(true);
    setStatusError(null);
    try {
      const updated = await tenantsApi.updateTenantStatus(id, statusChoice);
      setTenant(updated);
    } catch (err) {
      setStatusError(err instanceof ApiError ? err.message : 'Failed to update status.');
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await tenantsApi.deleteTenant(id, deleteConfirm);
      navigate('/superadmin', { replace: true });
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Failed to delete tenant.');
      setDeleting(false);
    }
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!tenant) return null;

  const plan = subscription?.planId;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/superadmin" className="muted" style={{ fontSize: 13 }}>
            ← Back to tenants
          </Link>
          <h1 style={{ marginTop: 6 }}>{tenant.displayName}</h1>
        </div>
        <span className={`badge ${STATUS_BADGE[tenant.status] || 'badge-neutral'}`}>{tenant.status}</span>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Tenant</h2>
        <div className="form-grid">
          <div className="field">
            <label>Slug</label>
            <div>{tenant.slug}</div>
          </div>
          <EditableField
            label="Business name"
            value={tenant.displayName}
            onSave={async (next) => setTenant(await tenantsApi.updateTenantProfile(id, next))}
          />
          <EditableField
            label="Owner email"
            value={owner?.email || ''}
            onSave={async (next) => setOwner(await tenantsApi.updateTenantOwnerEmail(id, next))}
          />
          <div className="field">
            <label>Timezone</label>
            <div>{tenant.timezone}</div>
          </div>
          <div className="field">
            <label>Currency</label>
            <div>{tenant.currency}</div>
          </div>
          <div className="field">
            <label>Created</label>
            <div>{formatDate(tenant.createdAt)}</div>
          </div>
          <div className="field">
            <label>Trial ends</label>
            <div>{formatDate(tenant.trialEndsAt)}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Subscription</h2>
        {subscription ? (
          <div className="form-grid">
            <div className="field">
              <label>Plan</label>
              <div>{plan ? `${plan.name} · R${plan.priceZAR.toFixed(2)}/${plan.billingInterval === 'annual' ? 'yr' : 'mo'}` : '—'}</div>
            </div>
            <div className="field">
              <label>Billing status</label>
              <div>
                <span className={`badge ${SUBSCRIPTION_BADGE[subscription.status] || 'badge-neutral'}`}>{subscription.status}</span>
              </div>
            </div>
            <div className="field">
              <label>Current period ends</label>
              <div>{formatDate(subscription.currentPeriodEnd)}</div>
            </div>
            <div className="field">
              <label>Grace period ends</label>
              <div>{formatDate(subscription.gracePeriodEndsAt)}</div>
            </div>
          </div>
        ) : (
          <p className="empty-state">This tenant has never started a subscription.</p>
        )}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Manual status override</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Normally set automatically (trial expiry, PayFast billing events). Use this to reactivate a tenant who paid
          outside PayFast, or to suspend one immediately.
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="select" value={statusChoice} onChange={(e) => setStatusChoice(e.target.value)}>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="past_due">Past due</option>
            <option value="suspended">Suspended</option>
          </select>
          <button
            type="button"
            className="btn btn-primary"
            disabled={statusSaving || statusChoice === tenant.status}
            onClick={handleStatusSave}
          >
            {statusSaving ? 'Saving…' : 'Save status'}
          </button>
        </div>
        {statusError && <p className="error-text">{statusError}</p>}
      </div>

      <div className="card" style={{ borderColor: 'var(--color-danger)' }}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Delete tenant</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Permanently deletes this tenant and everything belonging to it - staff, services, customers, appointments,
          payments, subscription. This cannot be undone. Type <strong>{tenant.slug}</strong> to confirm.
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder={tenant.slug}
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-danger"
            disabled={deleting || deleteConfirm !== tenant.slug}
            onClick={handleDelete}
          >
            {deleting ? 'Deleting…' : 'Delete tenant permanently'}
          </button>
        </div>
        {deleteError && <p className="error-text">{deleteError}</p>}
      </div>
    </div>
  );
}
