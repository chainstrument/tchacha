import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL;

export function createSocket(token) {
  return io(SOCKET_URL, {
    auth: { token },
    autoConnect: false,
  });
}
