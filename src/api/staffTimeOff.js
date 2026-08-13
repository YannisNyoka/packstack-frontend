import { apiFetch } from './client.js';

export function listTimeOff(staffMemberId) {
  return apiFetch(`/staff/${staffMemberId}/time-off`);
}

export function createTimeOff(staffMemberId, data) {
  return apiFetch(`/staff/${staffMemberId}/time-off`, { method: 'POST', body: data });
}

export function deleteTimeOff(staffMemberId, id) {
  return apiFetch(`/staff/${staffMemberId}/time-off/${id}`, { method: 'DELETE' });
}
