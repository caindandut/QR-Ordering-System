// src/pages/ManageOrdersPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket.js'; // 👈 1. "Ăng-ten"
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next'; // 👈 (Tùy chọn)

// (Import "linh kiện")
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { translateOrderStatus } from '@/lib/translations'; // 👈 (File dịch)
import { Loader2 } from 'lucide-react';

// --- HÀM GỌI API ---
const fetchAdminOrders = async () => {
  // 2. "Kéo" (Pull) - Gọi API Admin ta đã tạo (4.1)
  const response = await api.get('/api/admin/orders');
  return response.data;
};
// ---

export default function ManageOrdersPage() {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  
  // 3. LẤY CÁC CÔNG CỤ
  const queryClient = useQueryClient(); // "Ông sếp"
  const socket = useSocket(); // "Ăng-ten"
  
  // --- LOGIC ĐỌC (READ) ---
  const { data: allOrders, isLoading, isError } = useQuery({
    queryKey: ['admin_orders'], // 👈 Tên "ngăn kéo"
    queryFn: fetchAdminOrders,
  });

  // --- 4. 🧠 LOGIC "ĐẨY" (PUSH - REAL-TIME) ---
  useEffect(() => {
    // 4a. Phải chờ "ăng-ten" sẵn sàng
    if (!socket) return; 

    // 4b. "Lắng nghe" tín hiệu 'new_order_received' (từ API POST)
    const handleNewOrder = (newOrder) => {
      console.log('Đơn hàng mới!', newOrder);
      toast({
        title: "Có đơn hàng mới!",
        description: `Bàn ${newOrder.table?.name} vừa đặt món.`,
      });
      // 4c. "Bắn cò súng" - Báo "Giám sát viên" đi làm mới
      queryClient.invalidateQueries({ queryKey: ['admin_orders'] });
    };
    
    // 4d. "Lắng nghe" tín hiệu 'order_updated_for_admin' (từ API PATCH)
    const handleUpdateOrder = (updatedOrder) => {
      console.log('Đơn hàng được cập nhật!', updatedOrder);
      // 4e. "Bắn cò súng" - Báo "Giám sát viên" đi làm mới
      queryClient.invalidateQueries({ queryKey: ['admin_orders'] });
    };

    // 4f. Đăng ký "lắng nghe"
    socket.on('new_order_received', handleNewOrder);
    socket.on('order_updated_for_admin', handleUpdateOrder);

    // 5. 🧠 "Dọn dẹp" (Cleanup)
    //    (Khi component unmount, gỡ bỏ "lắng nghe")
    return () => {
      socket.off('new_order_received', handleNewOrder);
      socket.off('order_updated_for_admin', handleUpdateOrder);
    };
  }, [socket, queryClient, toast]); // 👈 Chạy lại nếu các công cụ thay đổi

  // --- 6. 🧠 LOGIC "LỌC" (FILTER - useMemo) ---
  const filteredOrders = useMemo(() => {
    if (!allOrders) return {}; // Trả về object rỗng
    
    // "Phân loại" mảng tổng thành các "ngăn kéo"
    return {
      PENDING: allOrders.filter(o => o.status === 'PENDING'),
      COOKING: allOrders.filter(o => o.status === 'COOKING'),
      SERVED: allOrders.filter(o => o.status === 'SERVED'),
      PAID: allOrders.filter(o => o.status === 'PAID'),
      CANCELLED: allOrders.filter(o => o.status === 'CANCELLED'),
    };
  }, [allOrders]); // 👈 "Lọc" lại khi `allOrders` thay đổi

  // --- 7. HÀM DỊCH (Helper) ---
  const renderStatus = (status) => {
    // Map i18n language code to translation function format
    // i18n might return 'jp' or 'ja', but our function uses 'jp'
    let currentLang = i18n.language || 'vi';
    if (currentLang === 'ja') currentLang = 'jp'; // Normalize to 'jp'
    const { text, variant } = translateOrderStatus(status, currentLang);
    return <Badge variant={variant}>{text}</Badge>;
  };
  
  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (isError) return <div className="p-4 text-red-500">Lỗi: Không thể tải đơn hàng.</div>;

  // --- 8. RENDER (HIỂN THỊ) ---
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Quản lý Đơn hàng (Real-time)</h1>

      <Tabs defaultValue="PENDING" className="w-full">
        {/* 8a. DANH SÁCH TABS (Nút bấm) */}
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto">
          <TabsTrigger value="PENDING">
            Chờ ({filteredOrders.PENDING?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="COOKING">
            Đang nấu ({filteredOrders.COOKING?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="SERVED">
            Đã phục vụ ({filteredOrders.SERVED?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="PAID">
            Đã thanh toán ({filteredOrders.PAID?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="CANCELLED">
            Đã hủy ({filteredOrders.CANCELLED?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* 8b. NỘI DUNG TABS (Các Thẻ Card) */}
        
        {/* Tab CHỜ XÁC NHẬN */}
        <TabsContent value="PENDING">
          <OrderList 
            orders={filteredOrders.PENDING} 
            renderStatus={renderStatus} 
          />
        </TabsContent>
        
        {/* Tab ĐANG NẤU */}
        <TabsContent value="COOKING">
          <OrderList 
            orders={filteredOrders.COOKING} 
            renderStatus={renderStatus} 
          />
        </TabsContent>
        
        {/* (Thêm các <TabsContent> cho SERVED, PAID, CANCELLED) */}
        
      </Tabs>
    </div>
  );
}

// --- 9. COMPONENT CON (OrderList & OrderCard) ---
//    (Tách ra cho sạch sẽ)

// Component "Danh sách Đơn hàng"
const OrderList = ({ orders, renderStatus }) => {
  if (!orders || orders.length === 0) {
    return <p className="text-center text-muted-foreground p-8">Không có đơn hàng nào.</p>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
      {orders.map(order => (
        <OrderCard key={order.id} order={order} renderStatus={renderStatus} />
      ))}
    </div>
  );
};

// Component "Thẻ Đơn hàng"
const OrderCard = ({ order, renderStatus }) => {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>Bàn: {order.table?.name}</CardTitle>
          <span className="text-sm text-muted-foreground">{order.customerName}</span>
        </div>
        {renderStatus(order.status)}
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        {order.details.map(detail => (
          <div key={detail.id} className="flex items-center gap-2">
            <Avatar className="h-10 w-10 rounded-md">
              <AvatarImage src={detail.menuItem?.imageUrl} alt={detail.menuItem?.name} />
              <AvatarFallback>{detail.menuItem?.name[0]}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{detail.quantity} x {detail.menuItem?.name}</span>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4 p-4 bg-muted/50">
        <div className="w-full flex justify-between font-bold">
          <span>Tổng:</span>
          <span>{order.totalAmount.toLocaleString('vi-VN')}đ</span>
        </div>
        
        {/* 👇 [ĐỂ TRỐNG] - Sẽ làm ở 4.4 👇 */}
        {/*
          <Select> (Nút đổi trạng thái) </Select>
          <Button> (Nút In hóa đơn) </Button>
        */}

      </CardFooter>
    </Card>
  );
};