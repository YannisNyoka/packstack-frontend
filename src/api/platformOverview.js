import { platformFetch } from './platformClient.js';

export function getOverview() {
  return platformFetch('/overview');
}
