import { apiFetch } from './client.js';

export function listIntegrations() {
  return apiFetch('/integrations');
}

export function connectWati(data) {
  return apiFetch('/integrations/wati', { method: 'POST', body: data });
}

export function connectResend(data) {
  return apiFetch('/integrations/resend', { method: 'POST', body: data });
}

export function connectYoco(data) {
  return apiFetch('/integrations/yoco', { method: 'POST', body: data });
}

export function disconnectIntegration(provider) {
  return apiFetch(`/integrations/${provider}`, { method: 'DELETE' });
}
