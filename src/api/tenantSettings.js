import { apiFetch } from './client.js';

export function getBookingRules() {
  return apiFetch('/settings/booking-rules');
}

export function updateBookingRules(data) {
  return apiFetch('/settings/booking-rules', { method: 'PATCH', body: data });
}
