
'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@vca/types';

export function useSocket(liveClassId?: string, userJWT?: string) {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize the socket server via the API route
    const initSocket = async () => {
      try {
        const socket = io('http://localhost:4001', {
          auth: {
            token: userJWT
          },
          transports: ['websocket', 'polling'],
          autoConnect: true,
        });

        socket.on('connect', () => {
          console.log('[Socket] Connected to server');
          setIsConnected(true);
          
          if (liveClassId) {
            socket.emit('join-room', liveClassId);
          }
        });

        socket.on('disconnect', () => {
          console.log('[Socket] Disconnected from server');
          setIsConnected(false);
        });

        socket.on('error', (msg) => {
          console.error('[Socket] Error:', msg);
        });

        socketRef.current = socket;
      } catch (err) {
        console.error('[Socket] Initialization failed:', err);
      }
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        if (liveClassId) {
          socketRef.current.emit('leave-room', liveClassId);
        }
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [liveClassId]);

  return {
    socket: socketRef.current,
    isConnected,
  };
}
