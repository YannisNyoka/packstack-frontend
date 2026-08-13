import { apiFetch, ApiError } from './client.js';

export async function getTheme() {
  try {
    return await apiFetch('/public/theme');
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export function listServices() {
  return apiFetch('/public/services');
}

export function listStaff() {
  return apiFetch('/public/staff');
}

export function getAvailability({ date, serviceIds, staffMemberId }) {
  const params = new URLSearchParams({ date, serviceIds: serviceIds.join(',') });
  if (staffMemberId) params.set('staffMemberId', staffMemberId);
  return apiFetch(`/public/availability?${params.toString()}`);
}

export function createAppointment(data) {
  return apiFetch('/public/appointments', { method: 'POST', body: data });
}

export function getDepositConfig() {
  return apiFetch('/public/deposit-config');
}

export function createDepositCheckout(data) {
  return apiFetch('/public/appointments/checkout', { method: 'POST', body: data });
}
