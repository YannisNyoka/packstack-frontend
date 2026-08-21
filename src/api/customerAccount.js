import { customerFetch } from './customerClient.js';

export function listAppointments(status) {
  return customerFetch(`/appointments?status=${status}`);
}

export function getAppointment(id) {
  return customerFetch(`/appointments/${id}`);
}

export function rescheduleAppointment(id, newStartTime) {
  return customerFetch(`/appointments/${id}/reschedule`, { method: 'PATCH', body: { newStartTime } });
}

export function cancelAppointment(id, reason) {
  return customerFetch(`/appointments/${id}/cancel`, { method: 'PATCH', body: { reason } });
}

export function getLoyalty() {
  return customerFetch('/loyalty');
}

export function getProfile() {
  return customerFetch('/profile');
}

export function updateProfile({ name, email }) {
  return customerFetch('/profile', { method: 'PATCH', body: { name, email } });
}

export function changePassword(currentPassword, newPassword) {
  return customerFetch('/password', { method: 'POST', body: { currentPassword, newPassword } });
}
