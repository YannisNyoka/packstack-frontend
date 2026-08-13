import { apiFetch } from './client.js';

export function listAppointments({ from, to, staffMemberId, status } = {}) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (staffMemberId) params.set('staffMemberId', staffMemberId);
  if (status) params.set('status', status);
  const query = params.toString();
  return apiFetch(`/appointments${query ? `?${query}` : ''}`);
}

export function createAppointment(data) {
  return apiFetch('/appointments', { method: 'POST', body: data });
}

export function rescheduleAppointment(id, newStartTime) {
  return apiFetch(`/appointments/${id}/reschedule`, { method: 'PATCH', body: { newStartTime } });
}

export function cancelAppointment(id, reason) {
  return apiFetch(`/appointments/${id}/cancel`, { method: 'PATCH', body: { reason } });
}

export function updateAppointmentStatus(id, status) {
  return apiFetch(`/appointments/${id}/status`, { method: 'PATCH', body: { status } });
}
