import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5050';

let socket: Socket | null = null;

export const initSocket = (token: string) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('✅ Socket conectado');
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket desconectado');
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
