import { Server as SocketIOServer } from 'socket.io';

// Type declaration for global io instance
declare global {
  var io: SocketIOServer | undefined;
}

export const getSocketServer = (): SocketIOServer | null => {
  if (typeof window !== 'undefined') {
    return null; // This is client-side
  }

  if (!global.io) {
    console.warn('Socket.IO server not initialized');
    return null;
  }

  return global.io;
};

export const emitToUser = (userId: string, event: string, data: any) => {
  const io = getSocketServer();
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToRoom = (roomId: string, event: string, data: any) => {
  const io = getSocketServer();
  if (io) {
    io.to(roomId).emit(event, data);
  }
};

export const emitToAll = (event: string, data: any) => {
  const io = getSocketServer();
  if (io) {
    io.emit(event, data);
  }
};

export const broadcastExceptSender = (socketId: string, event: string, data: any) => {
  const io = getSocketServer();
  if (io) {
    io.sockets.sockets.get(socketId)?.broadcast.emit(event, data);
  }
};




