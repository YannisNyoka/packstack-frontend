import { platformFetch } from './platformClient.js';

export function listPlans() {
  return platformFetch('/plans');
}

export function createPlan(data) {
  return platformFetch('/plans', { method: 'POST', body: data });
}

export function updatePlan(id, data) {
  return platformFetch(`/plans/${id}`, { method: 'PATCH', body: data });
}
