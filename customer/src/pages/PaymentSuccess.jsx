import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Loader2 } from 'lucide-react';

const fetchPaymentStatus = async (orderId) => {
  const response = await api.get(`/api/payments/${orderId}/status`);
  return response.data;
};

export default function PaymentSuccessPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  const { data: paymentStatus, isLoading } = useQuery({
    queryKey: ['paymentStatus', orderId],
    queryFn: () => fetchPaymentStatus(orderId),
    enabled: !!orderId,
    refetchInterval: 2000, // Refetch mỗi 2 giây để cập nhật trạng thái
  });

  useEffect(() => {
    // Nếu không có orderId, redirect về trang chủ
    if (!orderId) {
      navigate('/order/status');
    }
  }, [orderId, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-600 dark:text-green-400">
            {t('payment.success.title')}
          </CardTitle>
          <CardDescription className="mt-2">
            {t('payment.success.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentStatus && (
            <>
              {/* Mã đơn hàng */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('payment.order_id')}:</span>
                  <span className="font-medium">#{paymentStatus.orderId}</span>
                </div>
              </div>

              {/* Danh sách món ăn + số lượng + tiền (ngang hàng) */}
              {Array.isArray(paymentStatus.items) && paymentStatus.items.length > 0 && (
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto pr-1 border-t pt-3 text-sm text-muted-foreground">
                  {paymentStatus.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between"
                    >
                      <span className="flex-1">
                        {item.name}
                        <span className="ml-1">x{item.quantity}</span>
                      </span>
                      <span className="font-medium">
                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tổng tiền + trạng thái */}
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('payment.amount')}:</span>
                  <span className="font-medium">
                    {paymentStatus.totalAmount?.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('payment.status')}:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {t('payment.paid')}
                  </span>
                </div>
              </div>
            </>
          )}
          <div className="pt-4 space-y-2">
            <Button 
              onClick={() => navigate('/order/status')} 
              className="w-full"
              size="lg"
            >
              {t('payment.view_orders')}
            </Button>
            <Button 
              onClick={() => navigate('/order')} 
              variant="outline"
              className="w-full"
            >
              {t('payment.back_to_menu')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





