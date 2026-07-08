const onlineUsers = new Map();

export function addConnection(userId, socketId) {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }

  const sockets = onlineUsers.get(userId);
  sockets.add(socketId);

  return sockets.size === 1;
}

export function removeConnection(userId, socketId) {
  const sockets = onlineUsers.get(userId);
  if (!sockets) {
    return false;
  }

  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(userId);
    return true;
  }

  return false;
}

export function isOnline(userId) {
  return onlineUsers.has(userId);
}

export function getOnlineUserIds() {
  return Array.from(onlineUsers.keys());
}
