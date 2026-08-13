import { apiFetch } from './client.js';

export function listPayments(appointmentId) {
  return apiFetch(`/appointments/${appointmentId}/payments`);
}

export function recordPayment(appointmentId, data) {
  return apiFetch(`/appointments/${appointmentId}/payments`, { method: 'POST', body: data });
}
