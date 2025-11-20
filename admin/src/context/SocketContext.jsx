import React, { createContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';


// 1. Lấy URL Backend từ .env
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// 2. Tạo "Context" (Cái khuôn)
export const SocketContext = createContext();

// 3. Tạo "Nhà cung cấp" (Provider - Cái "ăng-ten" thật)
export const SocketProvider = ({ children }) => {
  // Dùng state để trigger re-render khi socket được tạo
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  // 6. Kết nối khi "Provider" được render
  useEffect(() => {
    // 6a. Chỉ kết nối nếu chưa có
    if (!socketRef.current) {
      console.log('🔌 Initializing Socket.IO connection...');
      
      // 6b. Tạo kết nối (Socket.IO client)
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socketRef.current = newSocket;
      setSocket(newSocket); // Trigger re-render để các component con có thể sử dụng socket

      // Listen to connection events
      newSocket.on('connect', () => {
        console.log('✅ Socket.IO connected successfully!', newSocket.id);
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket.IO disconnected');
        setConnected(false);
      });

      // Lắng nghe các sự kiện kết nối/lỗi
      newSocket.on('connect_error', (err) => {
        console.error('Lỗi kết nối Socket.IO (Admin):', err.message);
        setConnected(false);
      });
    }

    const currentSocket = socketRef.current; // Lấy socket hiện tại

    // 7. 🧠 KHÁI NIỆM: "Dọn dẹp" (Cleanup)
    //    TẠI SAO? Khi người dùng "Đăng xuất" (ProtectedRoute
    //    unmounts), chúng ta phải "ngắt kết nối" thủ công.
    //    Nếu không, kết nối sẽ "lơ lửng" (zombie connection).
    return () => {
      if (currentSocket) {
        console.log('🔌 Disconnecting socket...');
        currentSocket.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
    };
  }, []); // 👈 Mảng rỗng `[]` = Chỉ chạy 1 LẦN DUY NHẤT khi mount

  // 8. "Phát sóng" (Provide) kết nối cho các "con"
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};