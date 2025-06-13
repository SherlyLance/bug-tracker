// Socket.io client setup for real-time updates
import { io } from 'socket.io-client';
import config from './config';

let socket = null;

export const initSocket = () => {
  if (socket) return socket;
  
  // Connect to the socket server using the URL from config
  socket = io(config.socketUrl, {
    transports: ['websocket', 'polling'],
    autoConnect: true
  });
  
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
  
  return socket;
};

// Join a project room to receive project-specific updates
export const joinProjectRoom = (projectId) => {
  if (!socket) initSocket();
  if (projectId) {
    socket.emit('join-project', projectId);
    console.log(`Joined project room: project-${projectId}`);
  }
};

// Leave a project room when no longer needed
export const leaveProjectRoom = (projectId) => {
  if (!socket) return;
  if (projectId) {
    socket.emit('leave-project', projectId);
    console.log(`Left project room: project-${projectId}`);
  }
};

// Get the socket instance
export const getSocket = () => {
  if (!socket) return initSocket();
  return socket;
};

// Disconnect socket when no longer needed (e.g., on logout)
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected and reference cleared');
  }
};