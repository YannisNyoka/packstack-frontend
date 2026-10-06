import { apiFetch } from './client.js';

export function listConversations() {
  return apiFetch('/conversations');
}

export function getUnreadCount() {
  return apiFetch('/conversations/unread-count');
}

export function getConversation(id) {
  return apiFetch(`/conversations/${id}/messages`);
}

export function replyToConversation(id, body) {
  return apiFetch(`/conversations/${id}/messages`, { method: 'POST', body: { body } });
}

export function startConversation(customerId, body) {
  return apiFetch('/conversations', { method: 'POST', body: { customerId, body } });
}
