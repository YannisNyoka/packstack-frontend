import { getTenantSlug } from './tenant.js';
import { ApiError } from './client.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Mirrors api/client.js's in-memory-token pattern, but for the customer
// account surface - a completely separate credential (own login endpoint,
// own JWT audience/secret, own refresh cookie) that must never be confused
// with the owner/staff token in client.js. Hits /api/t/:slug/account/... -
// distinct from client.js's /api/t/:slug/... root, since customerAccount
// routes live under /account on the backend (see customerAccountRoutes.js).
let accessToken = null;

export function setCustomerAccessToken(token) {
  accessToken = token;
}

export function getCustomerAccessToken() {
  return accessToken;
}

async function parseErrorBody(res) {
  try {
    const data = await res.json();
    return data?.error || {};
  } catch {
    return {};
  }
}

export async function customerFetch(path, { method = 'GET', body, retry = true } = {}) {
  const url = `${API_BASE}/api/t/${getTenantSlug()}/account${path}`;
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
    const refreshed = await refreshCustomerAccessToken();
    if (refreshed) return customerFetch(path, { method, body, retry: false });
  }

  if (!res.ok) {
    const { message, code, details } = await parseErrorBody(res);
    throw new ApiError(res.status, message || `Request failed (${res.status})`, code, details);
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function refreshCustomerAccessToken() {
  try {
    const res = await fetch(`${API_BASE}/api/t/${getTenantSlug()}/account/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      setCustomerAccessToken(null);
      return false;
    }
    const data = await res.json();
    setCustomerAccessToken(data.accessToken);
    return true;
  } catch {
    setCustomerAccessToken(null);
    return false;
  }
}
