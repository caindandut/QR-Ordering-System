import { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import OrderCard from './OrderCard';
import dashboardService from '@/services/dashboardService';
import { useToast } from '@/hooks/use-toast';
import { SocketContext } from '@/context/SocketContext.jsx';
import { useTranslation } from 'react-i18next';

/**
 * ActiveOrdersList - Component hiển thị danh sách orders đang xử lý
 */
export default function ActiveOrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();
  const socket = useContext(SocketContext);
  const { t } = useTranslation();

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter.toUpperCase();
      }
      const data = await dashboardService.fetchActiveOrders(filters);
      setOrders(data);
    } catch {
      toast({
        title: t('dashboard.active_orders.error_title'),
        description: t('dashboard.active_orders.error_load'),
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  // Socket.IO real-time updates
  useEffect(() => {
    if (!socket) return;

    // Khi có đơn hàng mới
    const handleNewOrder = (newOrder) => {
      // Thêm vào đầu list nếu match filter
      if (statusFilter === 'all' || statusFilter === newOrder.status.toLowerCase()) {
        setOrders((prev) => [newOrder, ...prev]);
      }
      
      // Play notification sound (optional - can add later)
      // playNotificationSound();
      
      toast({
        title: t('dashboard.active_orders.new_order_title'),
        description: t('dashboard.active_orders.new_order_desc', { 
          table: newOrder.table?.name || `Bàn ${newOrder.tableId}`, 
          customer: newOrder.customerName 
        }),
        duration: 5000,
      });
    };

    // Khi order được cập nhật
    const handleOrderUpdate = (updatedOrder) => {
      setOrders((prev) => {
        // Nếu order không còn active (PAID, DENIED), xóa khỏi list
        if (!['PENDING', 'COOKING', 'SERVED'].includes(updatedOrder.status)) {
          return prev.filter((o) => o.id !== updatedOrder.id);
        }
        
        // Nếu không match filter, xóa
        if (statusFilter !== 'all' && statusFilter !== updatedOrder.status.toLowerCase()) {
          return prev.filter((o) => o.id !== updatedOrder.id);
        }
        
        // Cập nhật order
        const orderExists = prev.find((o) => o.id === updatedOrder.id);
        if (orderExists) {
          return prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
        } else {
          return [updatedOrder, ...prev];
        }
      });
    };

    socket.on('new_order_received', handleNewOrder);
    socket.on('order_updated_for_admin', handleOrderUpdate);

    return () => {
      socket.off('new_order_received', handleNewOrder);
      socket.off('order_updated_for_admin', handleOrderUpdate);
    };
  }, [socket, statusFilter, toast]);

  // Order actions
  const handleApprove = async (orderId) => {
    try {
      setActionLoading(true);
      await dashboardService.approveOrder(orderId);
      toast({
        title: t('dashboard.active_orders.approve_success_title'),
        description: t('dashboard.active_orders.approve_success_desc'),
        duration: 5000,
      });
    } catch {
      toast({
        title: t('dashboard.active_orders.error_title'),
        description: t('dashboard.active_orders.approve_error_desc'),
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeny = async (orderId) => {
    try {
      setActionLoading(true);
      await dashboardService.denyOrder(orderId);
      toast({
        title: t('dashboard.active_orders.deny_success_title'),
        description: t('dashboard.active_orders.deny_success_desc'),
        duration: 5000,
      });
    } catch {
      toast({
        title: t('dashboard.active_orders.error_title'),
        description: t('dashboard.active_orders.deny_error_desc'),
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleServed = async (orderId) => {
    try {
      setActionLoading(true);
      await dashboardService.markAsServed(orderId);
      toast({
        title: t('dashboard.active_orders.served_success_title'),
        description: t('dashboard.active_orders.served_success_desc'),
        duration: 5000,
      });
    } catch {
      toast({
        title: t('dashboard.active_orders.error_title'),
        description: t('dashboard.active_orders.served_error_desc'),
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-lg sm:text-xl">{t('dashboard.active_orders.title')}</CardTitle>
          
          {/* Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t('dashboard.active_orders.filter_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('dashboard.active_orders.filter_all')}</SelectItem>
              <SelectItem value="pending">{t('dashboard.active_orders.filter_pending')}</SelectItem>
              <SelectItem value="cooking">{t('dashboard.active_orders.filter_cooking')}</SelectItem>
              <SelectItem value="served">{t('dashboard.active_orders.filter_served')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('dashboard.active_orders.loading')}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('dashboard.active_orders.empty')}
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onApprove={handleApprove}
                onDeny={handleDeny}
                onServed={handleServed}
                loading={actionLoading}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
