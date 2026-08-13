import { apiFetch } from './client.js';

export function listDomains() {
  return apiFetch('/domains');
}

export function addDomain(domain) {
  return apiFetch('/domains', { method: 'POST', body: { domain } });
}

export function verifyDomain(domain) {
  return apiFetch(`/domains/${encodeURIComponent(domain)}/verify`, { method: 'POST' });
}

export function removeDomain(domain) {
  return apiFetch(`/domains/${encodeURIComponent(domain)}`, { method: 'DELETE' });
}
