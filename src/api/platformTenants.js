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

export function updateTenantProfile(id, displayName) {
  return platformFetch(`/tenants/${id}`, { method: 'PATCH', body: { displayName } });
}

export function updateTenantOwnerEmail(id, email) {
  return platformFetch(`/tenants/${id}/owner`, { method: 'PATCH', body: { email } });
}

export function deleteTenant(id, slug) {
  return platformFetch(`/tenants/${id}`, { method: 'DELETE', body: { slug } });
}
