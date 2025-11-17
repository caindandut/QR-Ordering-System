// src/context/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';

const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  // State lưu danh sách đơn hàng mới chưa xem
  const [newOrders, setNewOrders] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socket = useSocket();

  // Lắng nghe socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (newOrder) => {
      if (!newOrder || !newOrder.id) {
        console.error('Đơn hàng không hợp lệ:', newOrder);
        return;
      }

      // Thêm đơn hàng mới vào danh sách chưa đọc
      setNewOrders((prev) => {
        // Kiểm tra xem đã tồn tại chưa để tránh duplicate
        const exists = prev.some(order => order.id === newOrder.id);
        if (exists) return prev;
        return [newOrder, ...prev];
      });

      // Tăng số lượng thông báo chưa đọc
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('new_order_received', handleNewOrder);

    return () => {
      socket.off('new_order_received', handleNewOrder);
    };
  }, [socket]);

  // Hàm xóa tất cả thông báo (khi vào trang quản lý đơn hàng)
  const clearNotifications = () => {
    setNewOrders([]);
    setUnreadCount(0);
  };

  // Hàm xóa một thông báo cụ thể
  const removeNotification = (orderId) => {
    setNewOrders((prev) => prev.filter(order => order.id !== orderId));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const value = {
    newOrders,
    unreadCount,
    clearNotifications,
    removeNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

