import { platformFetch } from './platformClient.js';

export function listTenants() {
  return platformFetch('/tenants');
}

export function createTenant(data) {
  return platformFetch('/tenants', { method: 'POST', body: data });
}
