import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import * as billingApi from '../../api/billing.js';
import { ApiError } from '../../api/client.js';
import { useSlowLoad } from '../../hooks/useSlowLoad.js';

const SUBSCRIPTION_BADGE = {
  trialing: 'badge-neutral',
  active: 'badge-success',
  past_due: 'badge-warning',
  suspended: 'badge-danger',
  canceled: 'badge-neutral',
};

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

export function BillingSettingsPage() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const slowLoad = useSlowLoad(loading);
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
        <p className="muted">{slowLoad ? 'Waking up the server — this can take a few seconds…' : 'Loading…'}</p>
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
