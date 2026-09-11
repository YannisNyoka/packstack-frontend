import { apiFetch, setAccessToken, refreshAccessToken } from './client.js';

export async function login(email, password) {
  const data = await apiFetch('/auth/login', { method: 'POST', body: { email, password }, retry: false });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function logout() {
  await apiFetch('/auth/logout', { method: 'POST', retry: false }).catch(() => {});
  setAccessToken(null);
}

export async function getCurrentUser() {
  return apiFetch('/auth/me');
}

export async function acceptStaffInvite(token, password) {
  const data = await apiFetch('/auth/accept-invite', { method: 'POST', body: { token, password }, retry: false });
  setAccessToken(data.accessToken);
  return data.user;
}

export { refreshAccessToken };
