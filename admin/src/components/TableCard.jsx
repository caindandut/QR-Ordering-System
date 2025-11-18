import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

/**
 * TableCard - Component hiển thị bàn dạng card
 * Props:
 * - table: Object bàn {id, name, capacity, status}
 * - orders: Mảng đơn hàng hiện tại của bàn
 * - onClick: Callback khi click vào card
 */
export default function TableCard({ table, orders = [], onClick }) {
  const { t } = useTranslation();
  
  // Lọc đơn hàng đang active (chưa thanh toán hoặc hủy)
  const activeOrders = orders.filter(order => 
    ['PENDING', 'COOKING', 'SERVED'].includes(order.status)
  );
  
  // Tính tổng tiền của các đơn active
  const totalAmount = activeOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  
  // Lấy thời gian đơn cũ nhất (bàn đang dùng từ lúc nào)
  const oldestOrder = activeOrders.length > 0 
    ? activeOrders.reduce((oldest, order) => 
        new Date(order.createdAt) < new Date(oldest.createdAt) ? order : oldest
      )
    : null;
  
  // Tính thời gian sử dụng
  const getUsageTime = () => {
    if (!oldestOrder) return null;
    const minutes = Math.floor((Date.now() - new Date(oldestOrder.createdAt)) / 60000);
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };
  
  // Xác định màu theo trạng thái và số đơn
  const getStatusColor = () => {
    if (table.status === 'HIDDEN') {
      return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700';
    }
    if (activeOrders.length > 0) {
      // Màu theo độ khẩn
      if (activeOrders.some(o => o.status === 'SERVED')) {
        return 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 hover:bg-orange-200 dark:hover:bg-orange-900/50';
      }
      return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/50';
    }
    return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50';
  };
  
  // Badge trạng thái
  const getStatusBadge = () => {
    if (table.status === 'HIDDEN') {
      return <Badge variant="secondary" className="text-xs">Đã ẩn</Badge>;
    }
    if (activeOrders.length > 0) {
      return <Badge variant="destructive" className="text-xs">Đang dùng</Badge>;
    }
    return <Badge variant="default" className="text-xs bg-green-600">Trống</Badge>;
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg",
        getStatusColor(),
        table.status === 'HIDDEN' && 'opacity-60'
      )}
      onClick={() => onClick && onClick(table)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">{table.name}</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {/* Sức chứa */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>Sức chứa: {table.capacity} người</span>
        </div>
        
        {/* Thông tin khi bàn đang được dùng */}
        {activeOrders.length > 0 && (
          <>
            {/* Số đơn hàng */}
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShoppingCart className="h-4 w-4" />
              <span>{activeOrders.length} đơn hàng</span>
            </div>
            
            {/* Thời gian sử dụng */}
            {oldestOrder && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{getUsageTime()}</span>
              </div>
            )}
            
            {/* Tổng tiền */}
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Tổng tiền:</span>
                <span className="text-lg font-bold text-primary">
                  {totalAmount.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
          </>
        )}
        
        {/* Khi bàn trống */}
        {activeOrders.length === 0 && table.status !== 'HIDDEN' && (
          <div className="pt-2 text-center">
            <p className="text-sm text-muted-foreground italic">
              Bàn đang trống
            </p>
          </div>
        )}
        
        {/* Khi bàn bị ẩn */}
        {table.status === 'HIDDEN' && (
          <div className="pt-2 text-center">
            <p className="text-sm text-muted-foreground italic">
              Bàn đã bị ẩn
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


