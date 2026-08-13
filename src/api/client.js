import { getTenantSlug } from './tenant.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Access token lives in memory only, never localStorage/sessionStorage - if
// an attacker can run JS on this page at all, a token sitting in memory is
// just as reachable as one in storage, but memory at least doesn't survive
// a page reload or leak via other means (dev tools inspection of storage,
// browser extensions reading it, etc.). Lost on reload by design; the app
// re-derives it via a silent refresh() against the httpOnly cookie on boot -
// see auth/AuthContext.jsx.
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export class ApiError extends Error {
  constructor(status, message, code, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code || null;
    this.details = details || null;
  }
}

async function parseErrorBody(res) {
  try {
    const data = await res.json();
    return data?.error || {};
  } catch {
    return {};
  }
}

/**
 * Fetches `path` against this tenant's API (/api/t/<slug><path>). Attaches
 * the in-memory access token, sends the refresh cookie (`credentials:
 * 'include'`), and - on a 401 - attempts exactly one silent refresh + retry
 * before giving up, so a merely-expired access token doesn't bounce the user
 * to the login screen while their session is still otherwise valid.
 */
export async function apiFetch(path, { method = 'GET', body, retry = true } = {}) {
  const url = `${API_BASE}/api/t/${getTenantSlug()}${path}`;
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
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiFetch(path, { method, body, retry: false });
  }

  if (!res.ok) {
    const { message, code, details } = await parseErrorBody(res);
    throw new ApiError(res.status, message || `Request failed (${res.status})`, code, details);
  }

  if (res.status === 204) return null;
  return res.json();
}

/**
 * Same auth/retry contract as apiFetch, for a multipart file upload -
 * formData must NOT be JSON-stringified and must NOT get a manual
 * Content-Type header (the browser sets the multipart boundary itself when
 * given a FormData body directly).
 */
export async function apiUpload(path, formData, { retry = true } = {}) {
  const url = `${API_BASE}/api/t/${getTenantSlug()}${path}`;
  const headers = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: formData,
  });

  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiUpload(path, formData, { retry: false });
  }

  if (!res.ok) {
    const { message, code, details } = await parseErrorBody(res);
    throw new ApiError(res.status, message || `Request failed (${res.status})`, code, details);
  }

  return res.json();
}

export async function refreshAccessToken() {
  try {
    const res = await fetch(`${API_BASE}/api/t/${getTenantSlug()}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      setAccessToken(null);
      return false;
    }
    const data = await res.json();
    setAccessToken(data.accessToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}
