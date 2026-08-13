import { platformFetch, setPlatformAccessToken } from './platformClient.js';

export async function login(email, password) {
  const data = await platformFetch('/auth/login', { method: 'POST', body: { email, password } });
  setPlatformAccessToken(data.accessToken);
  return data.admin;
}

export function getCurrentAdmin() {
  return platformFetch('/auth/me');
}

export async function logout() {
  await platformFetch('/auth/logout', { method: 'POST' });
  setPlatformAccessToken(null);
}
