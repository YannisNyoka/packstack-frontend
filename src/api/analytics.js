import { apiFetch } from './client.js';

export function getOverview() {
  return apiFetch('/analytics/overview');
}

export function getUnpaidAppointments() {
  return apiFetch('/analytics/unpaid-appointments');
}

export function getSummary(range) {
  return apiFetch(`/analytics/summary?range=${range}`);
}
