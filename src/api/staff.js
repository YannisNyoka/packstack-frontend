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

export function inviteStaffAccess(id, email) {
  return apiFetch(`/staff/${id}/invite`, { method: 'POST', body: { email } });
}

export function resendStaffInvite(id) {
  return apiFetch(`/staff/${id}/invite/resend`, { method: 'POST' });
}

export function cancelStaffInvite(id) {
  return apiFetch(`/staff/${id}/invite`, { method: 'DELETE' });
}

export function revokeStaffAccess(id) {
  return apiFetch(`/staff/${id}/access`, { method: 'DELETE' });
}

export function reactivateStaffAccess(id) {
  return apiFetch(`/staff/${id}/access/reactivate`, { method: 'POST' });
}
