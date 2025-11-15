// src/pages/OrderStatus.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { io } from 'socket.io-client';
import { Loader2, Menu } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { translateOrderStatus } from '@/lib/translation';

// --- HÀM GỌI API MỚI ---
const fetchMyOrders = async (tableId, customerName) => {
  const response = await api.get('/api/orders', {
    params: { 
      table_id: tableId,
      customer_name: customerName,
    }
  });
  return response.data; // Trả về MẢNG
};

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function OrderStatusPage() {
  // 👇 [SỬA] ĐỌC TỪ localStorage, KHÔNG DÙNG useParams
  const tableId = localStorage.getItem('table_id');
  const customerName = localStorage.getItem('customer_name');
  const tableName = localStorage.getItem('table_name');

  // State "sống" (như cũ)
  const [orderStatuses, setOrderStatuses] = useState({});

  // 👇 [SỬA] Đảm bảo tên biến là `initialOrders` (số nhiều)
  const { 
    data: initialOrders, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['myOrders', tableId, customerName],
    queryFn: () => fetchMyOrders(tableId, customerName),
    enabled: !!tableId && !!customerName,
  });

  // useEffect (như cũ)
  useEffect(() => {
    // 5a. Cập nhật state "sống" khi data "ban đầu" về
    if (initialOrders) { // 👈 [SỬA] Dùng `initialOrders` (số nhiều)
      const initialStatusMap = {};
      initialOrders.forEach(order => {
        initialStatusMap[order.id] = order.status;
      });
      setOrderStatuses(initialStatusMap);
    }
    
    // 5b. Kết nối Socket
    const socket = io(SOCKET_URL);
    
    // 5c. "Tham gia" (join) NHIỀU "phòng"
    if (initialOrders) { // 👈 [SỬA] Dùng `initialOrders` (số nhiều)
      initialOrders.forEach(order => {
        if (order.status !== 'PAID' && order.status !== 'CANCELLED') {
          socket.emit('join_order_room', order.id);
        }
      });
    }
    
    // 5d. "Lắng nghe" sự kiện (như cũ)
    socket.on('order_status_updated', (data) => {
      setOrderStatuses(prevStatuses => ({
        ...prevStatuses,
        [data.orderId]: data.newStatus,
      }));
    });

    // 6. Dọn dẹp
    return () => {
      socket.disconnect();
    };
    
  }, [initialOrders]); // 👈 [SỬA] Dùng `initialOrders` (số nhiều)

 const renderStatusUI = (status) => {
    const { text, variant } = translateOrderStatus(status, 'vi');
    return <Badge variant={variant}>{text}</Badge>;
  };
  // --- RENDER ---
  if (isLoading) return (
    <div className="flex items-center justify-center h-screen gap-2">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span>Đang tải các đơn hàng...</span>
    </div>
  );
  if (isError) return <div className="p-4 text-red-500">Lỗi: Không thể tải lịch sử đơn hàng.</div>;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-[calc(100vh-65px)]">
      
      {/* 3. [THÊM MỚI] Hiển thị Tên Khách / Bàn */}
      <div className="max-w-2xl mx-auto mb-6">
         <h1 className="text-3xl font-bold">Tất cả Đơn hàng</h1>
         <p className="text-lg text-muted-foreground">
           Khách hàng: <span className="font-medium text-primary">{customerName}</span>
         </p>
         <p className="text-lg text-muted-foreground">
           Bàn: <span className="font-medium text-primary">{tableName}</span>
         </p>
      </div>
      
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 4. LẶP (MAP) QUA TẤT CẢ ĐƠN HÀNG */}
        {initialOrders && initialOrders.length > 0 ? (
          initialOrders.map((order, orderIndex) => ( // 👈 Thêm `orderIndex`
            <Card key={order.id} className="overflow-hidden shadow-md">
              <CardHeader className="flex flex-row items-center justify-between bg-white p-4">
                {/* 5. [THÊM MỚI] Thêm Số thứ tự */}
                <CardTitle className="text-xl">
                  Đơn hàng #{orderIndex + 1}
                </CardTitle>
                {renderStatusUI(orderStatuses[order.id])}
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                
                {order.details.map((detail, index) => (
                  <div key={detail.id} className="flex items-center gap-3">
                    {/* STT */}
                    <span className="text-sm text-muted-foreground">{index + 1}</span>
                
                    <img 
                      src={detail.menuItem.imageUrl} 
                      alt={detail.menuItem.name}
                      className="w-14 h-14 object-cover rounded-md border" // 👈 Style cho ảnh
                    />

                    {/* Tên & Số lượng */}
                    <div className="flex-grow">
                      <span className="font-semibold">{detail.menuItem.name}</span>
                      <p className="text-sm text-muted-foreground">
                        {detail.quantity} x {detail.priceAtOrder.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                    
                    {/* Giá (Tổng của line) */}
                    <span className="font-semibold">
                      {(detail.priceAtOrder * detail.quantity).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="bg-gray-50 p-4 flex justify-between items-center">
                {/* 7. [THÊM MỚI] Trạng thái Thanh toán */}
                <div className="text-sm">
                  {orderStatuses[order.id] !== 'PAID' ? (
                    <span className="font-bold text-red-600">CHƯA THANH TOÁN</span>
                  ) : (
                    <span className="font-bold text-green-600">ĐÃ THANH TOÁN</span>
                  )}
                </div>
                {/* Tổng tiền */}
                <div className="text-lg font-bold">
                  Tổng: {order.totalAmount.toLocaleString('vi-VN')}đ
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <p className="text-center text-muted-foreground">Bạn chưa đặt đơn hàng nào tại bàn này.</p>
        )}
      </div>
    </div>
  );
}