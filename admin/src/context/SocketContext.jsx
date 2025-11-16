import React, { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { SocketContext } from './SocketContext.js';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// 2. File này giờ CHỈ export 1 thứ duy nhất: Component "Provider"
export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL);
      // ... (code 'connect' và 'connect_error' của bạn)
    }
    const socket = socketRef.current;

    // Cleanup (Dọn dẹp)
    return () => {
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // 3. "Nhét" socket vào "cái khuôn"
  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};