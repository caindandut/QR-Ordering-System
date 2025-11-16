import React, { createContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';


// 1. Lấy URL Backend từ .env
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// 2. Tạo "Context" (Cái khuôn)
export const SocketContext = createContext();

// 3. Tạo "Nhà cung cấp" (Provider - Cái "ăng-ten" thật)
export const SocketProvider = ({ children }) => {
  // 5. Dùng `useRef` để giữ kết nối socket
  //    TẠI SAO? `useRef` sẽ *không* thay đổi giữa các
  //    lần render, đảm bảo chúng ta CHỈ KẾT NỐI 1 LẦN.
  const socketRef = useRef(null);

  // 6. Kết nối khi "Provider" được render
  useEffect(() => {
    // 6a. Chỉ kết nối nếu chưa có
    if (!socketRef.current) {
      // 6b. Tạo kết nối (Socket.IO client)
      socketRef.current = io(SOCKET_URL);

      // (Tùy chọn) Lắng nghe các sự kiện kết nối/lỗi
      socketRef.current.on('connect', () => {
        console.log('Socket.IO đã kết nối (Admin)');
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('Lỗi kết nối Socket.IO (Admin):', err.message);
      });
    }

    const socket = socketRef.current; // Lấy socket hiện tại

    // 7. 🧠 KHÁI NIỆM: "Dọn dẹp" (Cleanup)
    //    TẠI SAO? Khi người dùng "Đăng xuất" (ProtectedRoute
    //    unmounts), chúng ta phải "ngắt kết nối" thủ công.
    //    Nếu không, kết nối sẽ "lơ lửng" (zombie connection).
    return () => {
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
        console.log('Socket.IO đã ngắt kết nối (Admin)');
      }
    };
  }, []); // 👈 Mảng rỗng `[]` = Chỉ chạy 1 LẦN DUY NHẤT khi mount

  // 8. "Phát sóng" (Provide) kết nối cho các "con"
  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};