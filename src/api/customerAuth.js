import { customerFetch, setCustomerAccessToken, refreshCustomerAccessToken } from './customerClient.js';

export async function signup({ phone, name, email, password }) {
  const data = await customerFetch('/auth/signup', { method: 'POST', body: { phone, name, email, password }, retry: false });
  setCustomerAccessToken(data.accessToken);
  return data.customer;
}

export async function login(email, password) {
  const data = await customerFetch('/auth/login', { method: 'POST', body: { email, password }, retry: false });
  setCustomerAccessToken(data.accessToken);
  return data.customer;
}

export async function logout() {
  await customerFetch('/auth/logout', { method: 'POST', retry: false }).catch(() => {});
  setCustomerAccessToken(null);
}

export function getCurrentCustomer() {
  return customerFetch('/auth/me');
}

export function forgotPassword(email) {
  return customerFetch('/auth/forgot-password', { method: 'POST', body: { email }, retry: false });
}

export async function resetPassword(token, password) {
  const data = await customerFetch('/auth/reset-password', { method: 'POST', body: { token, password }, retry: false });
  setCustomerAccessToken(data.accessToken);
  return data.customer;
}

export { refreshCustomerAccessToken };
