import React, { createContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';


const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!socketRef.current) {
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      newSocket.on('connect', () => {
      });

      newSocket.on('disconnect', () => {
      });

      newSocket.on('connect_error', () => {
      });
    }

    const currentSocket = socketRef.current;

    return () => {
      if (currentSocket) {
        currentSocket.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
