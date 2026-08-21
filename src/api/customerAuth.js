import { customerFetch, setCustomerAccessToken, refreshCustomerAccessToken } from './customerClient.js';

export async function signup({ phone, name, email, password }) {
  const data = await customerFetch('/auth/signup', { method: 'POST', body: { phone, name, email, password }, retry: false });
  setCustomerAccessToken(data.accessToken);
  return data.customer;
}

export async function login(phone, password) {
  const data = await customerFetch('/auth/login', { method: 'POST', body: { phone, password }, retry: false });
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

export { refreshCustomerAccessToken };
