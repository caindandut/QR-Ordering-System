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
  const [newOrders, setNewOrders] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [paymentRequestCount, setPaymentRequestCount] = useState(0);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) {
      return;
    }
    
    const onConnect = () => {};
    
    const onDisconnect = () => {};
    
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    
    const handleNewOrder = (newOrder) => {
      if (!newOrder || !newOrder.id) {
        return;
      }

      setNewOrders((prev) => {
        const exists = prev.some(order => order.id === newOrder.id);
        if (exists) return prev;
        return [newOrder, ...prev];
      });

      setUnreadCount((prev) => prev + 1);
    };

    const handlePaymentRequest = (paymentRequest) => {
      if (!paymentRequest || !paymentRequest.orderId) {
        return;
      }

      const normalizedRequest = {
        type: paymentRequest.type || 'REQUEST',
        ...paymentRequest,
      };

      setPaymentRequests((prev) => {
        const exists = prev.some(
          (req) => req.orderId === normalizedRequest.orderId && req.type === normalizedRequest.type
        );
        if (exists) return prev;
        return [normalizedRequest, ...prev];
      });

      setPaymentRequestCount((prev) => prev + 1);
    };

    const handleOrderUpdatedForAdmin = (order) => {
      if (!order || !order.id) {
        return;
      }

      const paymentStatus = order.paymentStatus || order.status;
      if (paymentStatus === 'PAID' || paymentStatus === 'Paid' || paymentStatus?.toUpperCase() === 'PAID') {
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

  const clearNotifications = () => {
    setNewOrders([]);
    setUnreadCount(0);
  };

  const removeNotification = (orderId) => {
    setNewOrders((prev) => prev.filter(order => order.id !== orderId));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const removePaymentRequest = (orderId) => {
    setPaymentRequests((prev) => prev.filter(req => req.orderId !== orderId));
    setPaymentRequestCount((prev) => Math.max(0, prev - 1));
  };

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
