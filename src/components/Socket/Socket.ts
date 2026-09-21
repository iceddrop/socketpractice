import io, { Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function initSocket(url = 'https://socketpractice-nestjs.onrender.com'): Socket {
  if (socket) return socket;
  socket = io(url, {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    timeout: 20000,
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}