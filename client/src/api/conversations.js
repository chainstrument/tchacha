import { apiFetch } from './client.js';

export function listConversations() {
  return apiFetch('/conversations');
}

export function searchUsers(query) {
  return apiFetch(`/conversations/search-users?q=${encodeURIComponent(query)}`);
}

export function startConversation(userId) {
  return apiFetch('/conversations', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}
