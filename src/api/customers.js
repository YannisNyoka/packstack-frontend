import { apiFetch } from './client.js';

export function listCustomers({ search } = {}) {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiFetch(`/customers${query}`);
}

export function createCustomer(data) {
  return apiFetch('/customers', { method: 'POST', body: data });
}

export function updateCustomer(id, data) {
  return apiFetch(`/customers/${id}`, { method: 'PATCH', body: data });
}

export function adjustLoyaltyPoints(customerId, { pointsDelta, reasonNote }) {
  return apiFetch(`/customers/${customerId}/loyalty/adjust`, {
    method: 'POST',
    body: { pointsDelta, reasonNote },
  });
}
