import { platformFetch } from './platformClient.js';

export function listTenants() {
  return platformFetch('/tenants');
}

export function createTenant(data) {
  return platformFetch('/tenants', { method: 'POST', body: data });
}

export function getTenant(id) {
  return platformFetch(`/tenants/${id}`);
}

export function updateTenantStatus(id, status) {
  return platformFetch(`/tenants/${id}/status`, { method: 'PATCH', body: { status } });
}
