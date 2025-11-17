import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { io } from 'socket.io-client';
import { Loader2, DollarSign, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { translateOrderStatus } from '@/lib/translation';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// --- HÀM GỌI API MỚI ---
const fetchMyOrders = async (tableId, customerName) => {
  const response = await api.get('/api/orders', {
    params: { 
      table_id: tableId,
      customer_name: customerName,
    }
  });
  // Lọc ra các đơn hàng không bị hủy
  const activeOrders = response.data.filter(order => order.status !== 'CANCELLED');
  return activeOrders; // Trả về MẢNG
};

const requestPayment = async (orderId) => {
  const response = await api.post(`/api/orders/${orderId}/request-payment`);
  return response.data;
};

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function OrderStatusPage() {
  const { t, i18n } = useTranslation();
  // Normalize language code: 'ja' -> 'jp' để match với translation
  let lang = i18n.language || 'vi';
  if (lang === 'ja') lang = 'jp';
  const { toast } = useToast();
  
  // ĐỌC TỪ sessionStorage - mỗi tab có session riêng
  const tableId = sessionStorage.getItem('table_id');
  const customerName = sessionStorage.getItem('customer_name');
  const tableName = sessionStorage.getItem('table_name');

  // State "sống" (như cũ)
  const [orderStatuses, setOrderStatuses] = useState({});
  const [requestedPayments, setRequestedPayments] = useState({}); // Track yêu cầu thanh toán
  const [billData, setBillData] = useState(null); // Lưu dữ liệu hóa đơn
  const [showBillDialog, setShowBillDialog] = useState(false); // Hiển thị dialog hóa đơn

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

  // Mutation yêu cầu thanh toán
  const paymentRequestMutation = useMutation({
    mutationFn: requestPayment,
    onSuccess: (data, orderId) => {
      setRequestedPayments(prev => ({...prev, [orderId]: true}));
      toast({
        title: '✅ Yêu cầu thanh toán đã gửi',
        description: 'Nhân viên sẽ đến thanh toán cho bạn trong giây lát.',
        duration: 5000,
      });
    },
    onError: (err) => {
      toast({
        title: '❌ Lỗi',
        description: err.response?.data?.message || 'Không thể gửi yêu cầu thanh toán.',
        variant: 'destructive',
      });
    },
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
    
    // 5d. "Lắng nghe" sự kiện và hiển thị toast notification
    const handleOrderStatusUpdate = (data) => {
      const { orderId, newStatus } = data;
      
      // Cập nhật state
      setOrderStatuses(prevStatuses => ({
        ...prevStatuses,
        [orderId]: newStatus,
      }));
      
      // Tìm đơn hàng để lấy thông tin hiển thị trong toast
      const order = initialOrders?.find(o => o.id === orderId);
      const orderInfo = order ? `Đơn hàng #${orderId}` : `Đơn hàng #${orderId}`;
      
      // Hiển thị toast notification dựa trên trạng thái mới
      let toastTitle = '';
      let toastDescription = '';
      
      switch (newStatus) {
        case 'COOKING':
          toastTitle = '✅ Đơn hàng đã được xác nhận';
          toastDescription = `${orderInfo} đã được xác nhận và đang được chế biến.`;
          break;
        case 'SERVED':
          toastTitle = '🍽️ Đơn hàng đã được phục vụ';
          toastDescription = `${orderInfo} đã được phục vụ. Vui lòng kiểm tra và thanh toán.`;
          break;
        case 'PAID':
          toastTitle = '💰 Đơn hàng đã được thanh toán';
          toastDescription = `${orderInfo} đã được thanh toán thành công. Cảm ơn bạn!`;
          break;
        case 'CANCELLED':
          toastTitle = '❌ Đơn hàng đã bị hủy';
          toastDescription = `${orderInfo} đã bị hủy. Vui lòng liên hệ nhân viên nếu cần hỗ trợ.`;
          break;
        default:
          toastTitle = 'Cập nhật trạng thái đơn hàng';
          toastDescription = `${orderInfo} đã được cập nhật trạng thái.`;
      }
      
      toast({
        title: toastTitle,
        description: toastDescription,
        duration: 5000,
      });
    };

    // 5e. Nhận hóa đơn từ admin
    const handleBillReceived = (receivedBillData) => {
      const { orderId, totalAmount } = receivedBillData;
      
      // Lưu dữ liệu hóa đơn và hiển thị dialog
      setBillData(receivedBillData);
      setShowBillDialog(true);
      
      toast({
        title: '🧾 Nhận hóa đơn',
        description: `Hóa đơn cho đơn hàng #${orderId}: ${totalAmount?.toLocaleString('vi-VN')}đ. Vui lòng kiểm tra.`,
        duration: 5000,
      });
    };

    socket.on('order_status_updated', handleOrderStatusUpdate);
    socket.on('bill_received', handleBillReceived);

    // 6. Dọn dẹp
    return () => {
      socket.off('order_status_updated', handleOrderStatusUpdate);
      socket.off('bill_received', handleBillReceived);
      socket.disconnect();
    };
    
  }, [initialOrders, toast]); // Thêm toast vào dependency array

 const renderStatusUI = (status) => {
    const { text, variant } = translateOrderStatus(status, lang);
    return <Badge variant={variant}>{text}</Badge>;
  };
  // --- RENDER ---
  if (isLoading) return (
    <div className="flex items-center justify-center h-screen gap-2 text-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span>{t('status_page.loading')}</span>
    </div>
  );
  if (isError) return <div className="p-4 text-red-500">{t('status_page.error')}</div>;

  return (
    <div className="p-4 md:p-8 bg-background min-h-[calc(100vh-65px)]">
      {/* Dialog hiển thị hóa đơn */}
      <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">🧾 HÓA ĐƠN THANH TOÁN</DialogTitle>
          </DialogHeader>
          {billData && (
            <div className="space-y-4">
              <div className="border-b pb-3">
                <h3 className="text-lg font-bold text-center">NHÀ HÀNG</h3>
                <p className="text-sm text-center text-muted-foreground">Địa chỉ: 123 Đường ABC, TP.HCM</p>
                <p className="text-sm text-center text-muted-foreground">SĐT: 0123-456-789</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Hóa đơn #:</span>
                  <span className="font-medium">{billData.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Bàn:</span>
                  <span className="font-medium">{billData.tableName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Khách hàng:</span>
                  <span className="font-medium">{billData.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Thời gian:</span>
                  <span className="font-medium">
                    {billData.createdAt ? format(new Date(billData.createdAt), 'HH:mm dd/MM/yyyy') : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="border-t pt-3">
                <h4 className="font-semibold mb-2">Chi tiết đơn hàng:</h4>
                <div className="space-y-2">
                  {billData.details?.map((detail, index) => (
                    <div key={index} className="flex justify-between items-start text-sm">
                      <div className="flex-1">
                        <span className="font-medium">{detail.menuItem?.name}</span>
                        <span className="text-muted-foreground ml-2">x{detail.quantity}</span>
                      </div>
                      <span className="font-medium">
                        {(detail.priceAtOrder * detail.quantity).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">TỔNG CỘNG:</span>
                  <span className="text-2xl font-bold text-primary">
                    {billData.totalAmount?.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground pt-3 border-t">
                <p>Vui lòng kiểm tra hóa đơn</p>
                <p>Nhân viên sẽ đến thu tiền</p>
              </div>

              <Button onClick={() => setShowBillDialog(false)} className="w-full" size="lg">
                Đã kiểm tra, OK
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* 3. [THÊM MỚI] Hiển thị Tên Khách / Bàn */}
      <div className="max-w-2xl mx-auto mb-6">
         <h1 className="text-3xl font-bold text-foreground">{t('status_page.title')}</h1>
         <p className="text-lg text-muted-foreground">
           {t('status_page.customer')} <span className="font-medium text-primary">{customerName}</span>
         </p>
         <p className="text-lg text-muted-foreground">
           {t('status_page.table')} <span className="font-medium text-primary">{tableName}</span>
         </p>
      </div>
      
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 4. LẶP (MAP) QUA TẤT CẢ ĐƠN HÀNG */}
        {initialOrders && initialOrders.length > 0 ? (
          initialOrders.map((order, orderIndex) => ( // 👈 Thêm `orderIndex`
            <Card key={order.id} className="overflow-hidden shadow-md">
              <CardHeader className="flex flex-row items-center justify-between bg-card p-4">
                {/* 5. [THÊM MỚI] Thêm Số thứ tự */}
                <CardTitle className="text-xl text-card-foreground">
                  {t('status_page.order_number')}{orderIndex + 1}
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
                      <span className="font-semibold text-card-foreground">
                        {lang === 'jp' ? detail.menuItem.name_jp : detail.menuItem.name}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {detail.quantity} x {detail.priceAtOrder.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                    
                    {/* Giá (Tổng của line) */}
                    <span className="font-semibold text-card-foreground">
                      {(detail.priceAtOrder * detail.quantity).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="bg-muted p-4">
                <div className="w-full space-y-3">
                  {/* Hàng 1: Trạng thái thanh toán và tổng tiền */}
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      {orderStatuses[order.id] !== 'PAID' ? (
                        <span className="font-bold text-red-600 dark:text-red-400">{t('status_page.payment_not_paid')}</span>
                      ) : (
                        <span className="font-bold text-green-600 dark:text-green-400">{t('status_page.payment_paid')}</span>
                      )}
                    </div>
                    {/* Tổng tiền */}
                    <div className="text-lg font-bold text-foreground">
                      {t('status_page.total')} {order.totalAmount.toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                  
                  {/* Hàng 2: Nút yêu cầu thanh toán (chỉ hiện khi SERVED) */}
                  {orderStatuses[order.id] === 'SERVED' && !requestedPayments[order.id] && (
                    <Button 
                      onClick={() => paymentRequestMutation.mutate(order.id)}
                      disabled={paymentRequestMutation.isLoading}
                      className="w-full"
                      size="lg"
                    >
                      {paymentRequestMutation.isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <DollarSign className="mr-2 h-5 w-5" />
                          Yêu cầu thanh toán
                        </>
                      )}
                    </Button>
                  )}
                  
                  {/* Hiển thị trạng thái đã yêu cầu */}
                  {requestedPayments[order.id] && orderStatuses[order.id] === 'SERVED' && (
                    <div className="text-center text-sm text-primary font-medium p-2 bg-primary/10 rounded-md">
                      ✓ Đã gửi yêu cầu thanh toán. Vui lòng đợi nhân viên.
                    </div>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card className="p-8">
            <p className="text-center text-muted-foreground">{t('status_page.no_orders')}</p>
            <div className="flex justify-center mt-4">
              <Button asChild>
                <Link to="/order">{t('status_page.view_menu')}</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}