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
    } catch (error) {
      console.error('Error fetching active orders:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách đơn hàng',
        variant: 'destructive',
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
        title: 'Đơn hàng mới',
        description: `${newOrder.table?.name} - ${newOrder.customerName}`,
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
        title: 'Thành công',
        description: 'Đơn hàng đã được duyệt',
      });
    } catch {
      toast({
        title: 'Lỗi',
        description: 'Không thể duyệt đơn hàng',
        variant: 'destructive',
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
        title: 'Thành công',
        description: 'Đơn hàng đã bị từ chối',
      });
    } catch {
      toast({
        title: 'Lỗi',
        description: 'Không thể từ chối đơn hàng',
        variant: 'destructive',
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
        title: 'Thành công',
        description: 'Đơn hàng đã được đánh dấu là đã phục vụ',
      });
    } catch {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Đơn hàng đang xử lý</CardTitle>
          
          {/* Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="cooking">Đang nấu</SelectItem>
              <SelectItem value="served">Đã phục vụ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Đang tải...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Không có đơn hàng nào
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
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
