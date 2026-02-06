import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { translateTableStatus } from '@/lib/translations';

export default function TableCard({ table, orders = [], onClick }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const normalizedLang = lang === 'ja' ? 'jp' : lang;
  const numberLocale = normalizedLang === 'jp' ? 'ja-JP' : 'vi-VN';
  
  const activeOrders = orders.filter(order => 
    ['PENDING', 'COOKING', 'SERVED'].includes(order.status)
  );
  
  const totalAmount = activeOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  
  const oldestOrder = activeOrders.length > 0 
    ? activeOrders.reduce((oldest, order) => 
        new Date(order.createdAt) < new Date(oldest.createdAt) ? order : oldest
      )
    : null;
  
  const getUsageTime = () => {
    if (!oldestOrder) return null;
    const minutes = Math.floor((Date.now() - new Date(oldestOrder.createdAt)) / 60000);
    if (minutes < 60) return t('tables_page.card.usage_minutes', { count: minutes });
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return t('tables_page.card.usage_hours', { hours, minutes: remainingMinutes });
  };
  
  const getStatusColor = () => {
    if (table.status === 'HIDDEN') {
      return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700';
    }
    if (activeOrders.length > 0) {
      if (activeOrders.some(o => o.status === 'SERVED')) {
        return 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 hover:bg-orange-200 dark:hover:bg-orange-900/50';
      }
      return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/50';
    }
    return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50';
  };
  
  const getStatusBadge = () => {
    if (table.status === 'HIDDEN') {
      return (
        <Badge variant="secondary" className="text-xs">
          {translateTableStatus('HIDDEN', normalizedLang)}
        </Badge>
      );
    }
    if (activeOrders.length > 0) {
      return (
        <Badge variant="destructive" className="text-xs">
          {translateTableStatus('OCCUPIED', normalizedLang)}
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="text-xs bg-green-600">
        {translateTableStatus('AVAILABLE', normalizedLang)}
      </Badge>
    );
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{t('tables_page.card.capacity', { count: table.capacity })}</span>
        </div>
        
        {activeOrders.length > 0 && (
          <>
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShoppingCart className="h-4 w-4" />
              <span>{t('tables_page.card.orders', { count: activeOrders.length })}</span>
            </div>
            
            {oldestOrder && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{getUsageTime()}</span>
              </div>
            )}
            
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {t('tables_page.card.total_label')}
                </span>
                <span className="text-lg font-bold text-primary">
                  {totalAmount.toLocaleString(numberLocale)}đ
                </span>
              </div>
            </div>
          </>
        )}
        
        {activeOrders.length === 0 && table.status !== 'HIDDEN' && (
          <div className="pt-2 text-center">
            <p className="text-sm text-muted-foreground italic">
              {t('tables_page.card.empty')}
            </p>
          </div>
        )}
        
        {table.status === 'HIDDEN' && (
          <div className="pt-2 text-center">
            <p className="text-sm text-muted-foreground italic">
              {t('tables_page.card.hidden')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
