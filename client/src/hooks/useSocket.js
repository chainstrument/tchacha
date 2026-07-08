import { useEffect, useState } from 'react';
import { createSocket } from '../socket.js';
import { getToken } from '../api/auth.js';

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      return undefined;
    }

    const instance = createSocket(token);
    setSocket(instance);

    instance.on('connect', () => setConnected(true));
    instance.on('disconnect', () => setConnected(false));
    instance.connect();

    return () => {
      instance.disconnect();
      setSocket(null);
    };
  }, []);

  return { socket, connected };
}
