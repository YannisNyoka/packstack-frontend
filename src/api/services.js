import { apiFetch } from './client.js';

export function listServices({ includeInactive = false } = {}) {
  return apiFetch(`/services${includeInactive ? '?includeInactive=true' : ''}`);
}

export function createService(data) {
  return apiFetch('/services', { method: 'POST', body: data });
}

export function updateService(id, data) {
  return apiFetch(`/services/${id}`, { method: 'PATCH', body: data });
}

export function setServiceActive(id, active) {
  return apiFetch(`/services/${id}/active`, { method: 'PATCH', body: { active } });
}
