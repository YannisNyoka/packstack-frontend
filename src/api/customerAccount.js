import { customerFetch, setCustomerAccessToken } from './customerClient.js';

export function listAppointments(status) {
  return customerFetch(`/appointments?status=${status}`);
}

// The authenticated counterpart to api/publicBooking.js's createAppointment/
// createDepositCheckout - no customerDetails needed, identity comes from the
// logged-in customer's token. Used by BookingPage.jsx once a tenant requires
// an account to book (or a customer is simply already logged in).
export function createAppointment(data) {
  return customerFetch('/appointments', { method: 'POST', body: data });
}

export function createDepositCheckout(data) {
  return customerFetch('/appointments/checkout', { method: 'POST', body: data });
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

// The backend rotates the session's tokens as part of a password change
// (see customerAuthService.js#changeCustomerPassword) - it revokes every
// OTHER outstanding session, which also invalidates the access token this
// very request was authenticated with. Store the fresh one immediately so
// the next request on this tab keeps working instead of getting logged out
// by its own successful password change.
export async function changePassword(currentPassword, newPassword) {
  const { accessToken } = await customerFetch('/password', { method: 'POST', body: { currentPassword, newPassword } });
  setCustomerAccessToken(accessToken);
}
