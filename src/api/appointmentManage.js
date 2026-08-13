import { apiFetch } from './client.js';

export function getAppointmentByToken(token) {
  return apiFetch(`/public/appointments/manage?token=${encodeURIComponent(token)}`);
}

export function rescheduleByToken(token, newStartTime) {
  return apiFetch('/public/appointments/manage/reschedule', { method: 'PATCH', body: { token, newStartTime } });
}

export function cancelByToken(token, reason) {
  return apiFetch('/public/appointments/manage/cancel', { method: 'PATCH', body: { token, reason } });
}
