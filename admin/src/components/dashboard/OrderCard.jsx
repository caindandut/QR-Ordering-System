import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, Utensils } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi, ja } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { translateOrderStatus } from '@/lib/translations';

export default function OrderCard({ order, onApprove, onDeny, onServed, loading }) {
  const { t, i18n } = useTranslation();
  
  const getStatusBadge = (status) => {
    const currentLang = i18n.language === 'jp' ? 'jp' : 'vi';
    const statusTranslation = translateOrderStatus(status, currentLang);
    const statusMap = {
      PENDING: { className: 'bg-yellow-500' },
      COOKING: { className: 'bg-blue-500' },
      SERVED: { className: 'bg-green-500' },
      DENIED: { className: 'bg-red-500' },
      CANCELLED: { className: 'bg-red-500' },
      PAID: { className: 'bg-gray-500' },
    };
    return { 
      label: statusTranslation.text, 
      className: statusMap[status]?.className || 'bg-gray-500' 
    };
  };

  const statusInfo = getStatusBadge(order.status);
  const locale = i18n.language === 'jp' ? ja : vi;
  const timeAgo = formatDistanceToNow(new Date(order.createdAt), {
    addSuffix: true,
    locale: locale,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {order.table?.name || t('dashboard.order_card.table', { id: order.tableId })}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{order.customerName}</span>
            </div>
          </div>
          <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-sm font-medium">
            <Utensils className="h-3 w-3" />
            <span>{t('dashboard.order_card.items')}</span>
          </div>
          <div className="space-y-1 pl-4">
            {order.details?.map((detail, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {detail.quantity}x {detail.menuItem.name}
                </span>
                <span className="text-muted-foreground">
                  {(detail.priceAtOrder * detail.quantity).toLocaleString('vi-VN')}đ
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
          </div>
          <div className="text-lg font-bold">
            {order.totalAmount.toLocaleString('vi-VN')}đ
          </div>
        </div>

        <div className="flex gap-2">
          {order.status === 'PENDING' && (
            <>
              <Button
                size="sm"
                variant="default"
                className="flex-1"
                onClick={() => onApprove(order.id)}
                disabled={loading}
              >
                {t('dashboard.order_card.approve')}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => onDeny(order.id)}
                disabled={loading}
              >
                {t('dashboard.order_card.deny')}
              </Button>
            </>
          )}
          {order.status === 'COOKING' && (
            <Button
              size="sm"
              variant="default"
              className="w-full"
              onClick={() => onServed(order.id)}
              disabled={loading}
            >
              {t('dashboard.order_card.mark_served')}
            </Button>
          )}
          {order.status === 'SERVED' && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              disabled
            >
              {t('dashboard.order_card.waiting_payment')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
