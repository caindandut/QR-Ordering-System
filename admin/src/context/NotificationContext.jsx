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
  const [paymentRequests, setPaymentRequests] = useState([]); // Yêu cầu / thông báo liên quan đến thanh toán
  const [paymentRequestCount, setPaymentRequestCount] = useState(0);
  const socket = useSocket();

  // Lắng nghe socket events
  useEffect(() => {
    if (!socket) {
      return;
    }
    
    // Listen for connection events
    const onConnect = () => {};
    
    const onDisconnect = () => {};
    
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    
    const handleNewOrder = (newOrder) => {
      if (!newOrder || !newOrder.id) {
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

    const handlePaymentRequest = (paymentRequest) => {
      if (!paymentRequest || !paymentRequest.orderId) {
        return;
      }

      // Chuẩn hóa object (mặc định type = 'REQUEST' nếu chưa có)
      const normalizedRequest = {
        type: paymentRequest.type || 'REQUEST',
        ...paymentRequest,
      };

      // Thêm yêu cầu thanh toán vào danh sách
      setPaymentRequests((prev) => {
        const exists = prev.some(
          (req) => req.orderId === normalizedRequest.orderId && req.type === normalizedRequest.type
        );
        if (exists) return prev;
        return [normalizedRequest, ...prev];
      });

      // Tăng số lượng thông báo liên quan đến thanh toán
      setPaymentRequestCount((prev) => prev + 1);
    };

    // Khi đơn hàng được cập nhật cho admin (bao gồm cả VNPay thành công)
    const handleOrderUpdatedForAdmin = (order) => {
      if (!order || !order.id) {
        return;
      }

      // Chỉ quan tâm tới các đơn đã thanh toán (ví dụ VNPay thành công)
      // Kiểm tra cả 'PAID' và 'Paid' để đảm bảo tương thích
      const paymentStatus = order.paymentStatus || order.status;
      if (paymentStatus === 'PAID' || paymentStatus === 'Paid' || paymentStatus?.toUpperCase() === 'PAID') {
        // Đảm bảo lấy đúng table name từ order.table hoặc order.tableName
        const tableName = order.table?.name || order.tableName || null;
        const customerName = order.customerName || null;
        const totalAmount = order.totalAmount ? Number(order.totalAmount) : 0;

        const notification = {
          type: 'VNPAY_SUCCESS',
          orderId: order.id,
          tableName: tableName,
          customerName: customerName,
          totalAmount: totalAmount,
          createdAt: order.updatedAt || order.createdAt,
        };
        
        setPaymentRequests((prev) => {
          const exists = prev.some(
            (req) => req.orderId === notification.orderId && req.type === notification.type
          );
          if (exists) {
            return prev;
          }
          return [notification, ...prev];
        });

        setPaymentRequestCount((prev) => prev + 1);
      } 
    };

    socket.on('new_order_received', handleNewOrder);
    socket.on('payment_requested', handlePaymentRequest);
    socket.on('order_updated_for_admin', handleOrderUpdatedForAdmin);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new_order_received', handleNewOrder);
      socket.off('payment_requested', handlePaymentRequest);
      socket.off('order_updated_for_admin', handleOrderUpdatedForAdmin);
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

  // Hàm xóa yêu cầu thanh toán
  const removePaymentRequest = (orderId) => {
    setPaymentRequests((prev) => prev.filter(req => req.orderId !== orderId));
    setPaymentRequestCount((prev) => Math.max(0, prev - 1));
  };

  // Hàm xóa tất cả yêu cầu thanh toán
  const clearPaymentRequests = () => {
    setPaymentRequests([]);
    setPaymentRequestCount(0);
  };

  const value = {
    newOrders,
    unreadCount,
    clearNotifications,
    removeNotification,
    paymentRequests,
    paymentRequestCount,
    removePaymentRequest,
    clearPaymentRequests,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

