import { customerFetch } from './customerClient.js';

export function getMyMessages() {
  return customerFetch('/messages');
}

export function sendMyMessage(body) {
  return customerFetch('/messages', { method: 'POST', body: { body } });
}
