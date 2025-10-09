// home/ubuntu/impaktrweb/src/components/providers/SocketProvider.tsx

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const user = session?.user;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempted, setConnectionAttempted] = useState(false);

  useEffect(() => {
    // Only attempt connection if Socket.IO is enabled
    const isSocketEnabled = process.env.NEXT_PUBLIC_ENABLE_SOCKET === 'true';
    
    if (user && isSocketEnabled && !connectionAttempted) {
      setConnectionAttempted(true);
      
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        auth: {
          userId: user.id,
        },
        timeout: 5000, // 5 second timeout
        forceNew: true,
      });

      socketInstance.on('connect', () => {
        console.log('✅ Socket.IO Connected to server');
        setIsConnected(true);
        // Send authentication event after connection
        socketInstance.emit('authenticate', { userId: user.id });
      });

      socketInstance.on('disconnect', () => {
        console.log('📡 Socket.IO disconnected from server');
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        // Only log once and don't spam the console
        console.warn('⚠️ Socket.IO server not available - running in offline mode');
        setIsConnected(false);
        // Don't attempt to reconnect automatically
        socketInstance.disconnect();
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.close();
      };
    } else if (!isSocketEnabled) {
      console.log('📡 Socket.IO disabled - running in offline mode');
    }

    return () => {
      // Cleanup when user is not available
    };
  }, [user, connectionAttempted]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}