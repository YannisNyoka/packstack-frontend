import { ApiError } from './client.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Mirrors api/client.js's in-memory-token pattern, but for the superadmin
// console - a completely separate credential (different login endpoint,
// different JWT audience/secret, hits /api/platform/... directly instead of
// /api/t/:slug/...) that must never be confused with a tenant user's token.
let accessToken = null;

export function setPlatformAccessToken(token) {
  accessToken = token;
}

async function parseErrorBody(res) {
  try {
    const data = await res.json();
    return data?.error || {};
  } catch {
    return {};
  }
}

export async function platformFetch(path, { method = 'GET', body, retry = true } = {}) {
  const url = `${API_BASE}/api/platform${path}`;
  const headers = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && retry) {
    const refreshed = await refreshPlatformAccessToken();
    if (refreshed) return platformFetch(path, { method, body, retry: false });
  }

  if (!res.ok) {
    const { message, code, details } = await parseErrorBody(res);
    throw new ApiError(res.status, message || `Request failed (${res.status})`, code, details);
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function refreshPlatformAccessToken() {
  try {
    const res = await fetch(`${API_BASE}/api/platform/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (!res.ok) {
      setPlatformAccessToken(null);
      return false;
    }
    const data = await res.json();
    setPlatformAccessToken(data.accessToken);
    return true;
  } catch {
    setPlatformAccessToken(null);
    return false;
  }
}
