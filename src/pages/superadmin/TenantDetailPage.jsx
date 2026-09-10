import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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

export function TenantDetailPage() {
  const { id } = useParams();
  const [tenant, setTenant] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusChoice, setStatusChoice] = useState('trial');
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await tenantsApi.getTenant(id);
      setTenant(data.tenant);
      setSubscription(data.subscription);
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

      <div className="card">
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
    </div>
  );
}
