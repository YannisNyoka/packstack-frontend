import { apiFetch, ApiError } from './client.js';

export function listPlans() {
  return apiFetch('/billing/plans');
}

export async function getSubscription() {
  try {
    return await apiFetch('/billing/subscription');
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export function createCheckout(planId) {
  return apiFetch('/billing/checkout', { method: 'POST', body: { planId } });
}

export function cancelSubscription() {
  return apiFetch('/billing/cancel', { method: 'POST' });
}
