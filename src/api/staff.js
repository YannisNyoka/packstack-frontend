import { apiFetch } from './client.js';

export function listStaff({ includeInactive = false } = {}) {
  return apiFetch(`/staff${includeInactive ? '?includeInactive=true' : ''}`);
}

export function createStaffMember(data) {
  return apiFetch('/staff', { method: 'POST', body: data });
}

export function updateStaffMember(id, data) {
  return apiFetch(`/staff/${id}`, { method: 'PATCH', body: data });
}
