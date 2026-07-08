import jwt from 'jsonwebtoken';

export function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('missing authentication token'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.sub;
    next();
  } catch {
    next(new Error('invalid or expired token'));
  }
}

export function registerChatHandlers(io, socket) {
  socket.join(`user:${socket.userId}`);
}
