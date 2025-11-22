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

const cancelOrder = async (orderId) => {
  const response = await api.post(`/api/orders/${orderId}/cancel`);
  return response.data;
};

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function OrderStatusPage() {
  const { t, i18n } = useTranslation();
  // Normalize language code: 'ja' -> 'jp' để match với translation
  let lang = i18n.language || 'vi';
  if (lang === 'ja') lang = 'jp';
  const { toast } = useToast();
  const fallbackValue = t('status_page.na', { defaultValue: 'N/A' });
  
  // ĐỌC TỪ sessionStorage - mỗi tab có session riêng
  const tableId = sessionStorage.getItem('table_id');
  const customerName = sessionStorage.getItem('customer_name');
  const tableName = sessionStorage.getItem('table_name');

  // State "sống" (như cũ)
  const [orderStatuses, setOrderStatuses] = useState({});
  const [requestedPayments, setRequestedPayments] = useState({}); // Track yêu cầu thanh toán
  const [billData, setBillData] = useState(null); // Lưu dữ liệu hóa đơn hiện tại đang xem
  const [showBillDialog, setShowBillDialog] = useState(false); // Hiển thị dialog hóa đơn
  const [orderBills, setOrderBills] = useState({}); // Lưu dữ liệu hóa đơn cho từng đơn hàng

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
      
      // Lưu dữ liệu hóa đơn cho đơn hàng này
      const order = initialOrders?.find(o => o.id === orderId);
      if (order) {
        const billDataForOrder = {
          orderId: order.id,
          tableName: tableName,
          customerName: customerName,
          createdAt: order.createdAt,
          details: order.details,
          totalAmount: order.totalAmount,
        };
        setOrderBills(prev => ({...prev, [orderId]: billDataForOrder}));
      }
      
      toast({
        title: t('status_page.payment.toast_success_title'),
        description: t('status_page.payment.toast_success_desc'),
        duration: 5000,
      });
    },
    onError: (err) => {
      toast({
        title: t('status_page.payment.toast_error_title'),
        description: err.response?.data?.message || t('status_page.payment.toast_error_desc'),
        variant: 'destructive',
        duration: 5000,
      });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: (_, orderId) => {
      setOrderStatuses(prev => ({ ...prev, [orderId]: 'CANCELLED' }));
      setRequestedPayments(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
      setOrderBills(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
      toast({
        title: t('status_page.cancel.toast_success_title'),
        description: t('status_page.cancel.toast_success_desc'),
        duration: 5000,
      });
    },
    onError: (err) => {
      toast({
        title: t('status_page.cancel.toast_error_title'),
        description: err.response?.data?.message || t('status_page.cancel.toast_error_desc'),
        variant: 'destructive',
        duration: 5000,
      });
    },
  });
  const handleCancelOrder = (orderId) => {
    cancelOrderMutation.mutate(orderId);
  };

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
      
      // Hiển thị toast notification từ góc nhìn khách hàng
      const statusToastMap = {
        COOKING: {
          title: t('status_page.toasts.cooking.title'),
          description: t('status_page.toasts.cooking.desc'),
        },
        SERVED: {
          title: t('status_page.toasts.served.title'),
          description: t('status_page.toasts.served.desc'),
        },
        PAID: {
          title: t('status_page.toasts.paid.title'),
          description: t('status_page.toasts.paid.desc'),
        },
        CANCELLED: {
          title: t('status_page.toasts.cancelled.title'),
          description: t('status_page.toasts.cancelled.desc'),
        },
        DENIED: {
          title: t('status_page.toasts.denied.title'),
          description: t('status_page.toasts.denied.desc'),
        },
      };
      
      const toastContent = statusToastMap[newStatus] || {
        title: t('status_page.toasts.default.title'),
        description: t('status_page.toasts.default.desc'),
      };
      
      toast({
        title: toastContent.title,
        description: toastContent.description,
        duration: 5000,
      });
    };

    socket.on('order_status_updated', handleOrderStatusUpdate);

    // 6. Dọn dẹp
    return () => {
      socket.off('order_status_updated', handleOrderStatusUpdate);
      socket.disconnect();
    };
    
  }, [initialOrders, toast]); // Thêm toast vào dependency array

  // Hàm xem biên lai
  const handleViewBill = (orderId) => {
    const bill = orderBills[orderId];
    if (bill) {
      setBillData(bill);
      setShowBillDialog(true);
    }
  };

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
            <DialogTitle className="text-center">{t('status_page.payment.dialog_title')}</DialogTitle>
          </DialogHeader>
          {billData && (
            <div>
              {/* Nội dung biên lai giống admin */}
              <div style={{ padding: '20px', fontFamily: 'monospace' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h1 style={{ fontSize: '24px', margin: '0' }}>{t('status_page.receipt.title')}</h1>
                  <h2 style={{ fontSize: '20px', margin: '5px 0' }}>{t('status_page.receipt.restaurant_name')}</h2>
                  <p style={{ margin: '5px 0' }}>{t('status_page.receipt.address')}</p>
                  <p style={{ margin: '5px 0' }}>{t('status_page.receipt.phone')}</p>
                  <hr style={{ border: '1px dashed #000' }} />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <p style={{ margin: '5px 0' }}><strong>{t('status_page.receipt.invoice_number')}</strong> {billData.orderId}</p>
                  <p style={{ margin: '5px 0' }}><strong>{t('status_page.receipt.table')}</strong> {billData.tableName}</p>
                  <p style={{ margin: '5px 0' }}><strong>{t('status_page.receipt.customer')}</strong> {billData.customerName}</p>
                  <p style={{ margin: '5px 0' }}><strong>{t('status_page.receipt.time')}</strong> {billData.createdAt ? format(new Date(billData.createdAt), 'HH:mm dd/MM/yyyy') : fallbackValue}</p>
                  <hr style={{ border: '1px dashed #000' }} />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #000' }}>
                        <th style={{ textAlign: 'left', padding: '5px' }}>{t('status_page.receipt.table_header_item')}</th>
                        <th style={{ textAlign: 'center', padding: '5px' }}>{t('status_page.receipt.table_header_qty')}</th>
                        <th style={{ textAlign: 'right', padding: '5px' }}>{t('status_page.receipt.table_header_price')}</th>
                        <th style={{ textAlign: 'right', padding: '5px' }}>{t('status_page.receipt.table_header_total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billData.details?.map((detail, index) => (
                        <tr key={index} style={{ borderBottom: '1px dotted #ccc' }}>
                          <td style={{ padding: '8px 5px' }}>{detail.menuItem?.name}</td>
                          <td style={{ textAlign: 'center', padding: '8px 5px' }}>{detail.quantity}</td>
                          <td style={{ textAlign: 'right', padding: '8px 5px' }}>
                            {detail.priceAtOrder?.toLocaleString('vi-VN')}đ
                          </td>
                          <td style={{ textAlign: 'right', padding: '8px 5px' }}>
                            {(detail.priceAtOrder * detail.quantity).toLocaleString('vi-VN')}đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <hr style={{ border: '1px dashed #000' }} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
                    <span>{t('status_page.receipt.grand_total')}</span>
                    <span>{billData.totalAmount?.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <p style={{ margin: '5px 0' }}>{t('status_page.receipt.thank_you')}</p>
                  <p style={{ margin: '5px 0' }}>{t('status_page.receipt.see_you')}</p>
                </div>
              </div>

              {/* Nút đóng */}
              <div className="px-4 pb-4">
                <Button onClick={() => setShowBillDialog(false)} className="w-full" size="lg">
                  {t('status_page.payment.close_button')}
                </Button>
              </div>
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
          initialOrders.map((order, orderIndex) => {
            if (orderStatuses[order.id] === 'CANCELLED') {
              return null;
            }
            return (
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
                  
                  {/* Hàng 2: Hủy đơn (khi đang chờ xử lý) */}
                  {orderStatuses[order.id] === 'PENDING' && (
                    <Button
                      onClick={() => handleCancelOrder(order.id)}
                      variant="outline"
                      className="w-full"
                      size="lg"
                      disabled={cancelOrderMutation.isLoading && cancelOrderMutation.variables === order.id}
                    >
                      {cancelOrderMutation.isLoading && cancelOrderMutation.variables === order.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('status_page.cancel.cancelling')}
                        </>
                      ) : (
                        <>
                          <X className="mr-2 h-5 w-5" />
                          {t('status_page.cancel.button')}
                        </>
                      )}
                    </Button>
                  )}

                  {/* Hàng 3: Nút yêu cầu thanh toán (chỉ hiện khi SERVED) */}
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
                          {t('status_page.payment.requesting')}
                        </>
                      ) : (
                        <>
                          <DollarSign className="mr-2 h-5 w-5" />
                          {t('status_page.payment.request_button')}
                        </>
                      )}
                    </Button>
                  )}
                  
                  {/* Hiển thị nút xem biên lai khi đã yêu cầu thanh toán */}
                  {requestedPayments[order.id] && orderStatuses[order.id] === 'SERVED' && (
                    <div className="space-y-2">
                      <div className="text-center text-sm text-primary font-medium p-2 bg-primary/10 rounded-md">
                        {t('status_page.payment.requested_message')}
                      </div>
                      <Button 
                        onClick={() => handleViewBill(order.id)}
                        variant="outline"
                        className="w-full"
                        size="lg"
                      >
                        {t('status_page.payment.view_receipt')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardFooter>
            </Card>
          );})
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