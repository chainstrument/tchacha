import { apiFetch } from './client.js';

export function getMessages(conversationId, { before, limit } = {}) {
  const params = new URLSearchParams();
  if (before) params.set('before', before);
  if (limit) params.set('limit', limit);

  const qs = params.toString();
  return apiFetch(`/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`);
}
