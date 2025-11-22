import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { vi, ja } from 'date-fns/locale';
import { translateOrderStatus } from '@/lib/translations';
import { useTranslation } from 'react-i18next';

export default function TableDetailsModal({ isOpen, onClose, table }) {
  const { t, i18n } = useTranslation();
  
  if (!table || !table.currentOrder) {
    return null;
  }

  const order = table.currentOrder;
  const locale = i18n.language === 'jp' ? ja : vi;

  const getStatusVariant = (status) => {
    switch (status) {
      case 'PENDING':
        return 'secondary';
      case 'COOKING':
        return 'default';
      case 'SERVED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{table.name}</span>
            <Badge variant="outline" className="ml-2">
              <Users className="h-3 w-3 mr-1" />
              {t('dashboard.table_details.capacity', { count: table.capacity })}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {t('dashboard.table_details.title')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
            <div>
              <div className="text-sm text-muted-foreground">{t('dashboard.table_details.customer')}</div>
              <div className="font-semibold">{order.customerName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t('dashboard.table_details.order_time')}</div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="text-sm">
                  {format(new Date(order.createdAt), 'HH:mm - dd/MM/yyyy', { locale: locale })}
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t('dashboard.table_details.status')}</div>
              <Badge variant={getStatusVariant(order.status)}>
                {translateOrderStatus(order.status, i18n.language === 'jp' ? 'jp' : 'vi').text}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t('dashboard.table_details.total')}</div>
              <div className="font-bold text-primary">
                {order.totalAmount.toLocaleString('vi-VN')}đ
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">{t('dashboard.table_details.items_title')}</h4>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('dashboard.table_details.table_item')}</TableHead>
                    <TableHead className="text-center">{t('dashboard.table_details.table_qty')}</TableHead>
                    <TableHead className="text-right">{t('dashboard.table_details.table_price')}</TableHead>
                    <TableHead className="text-right">{t('dashboard.table_details.table_subtotal')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.details.map((detail, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 rounded-md">
                            <AvatarImage
                              src={detail.menuItemImage}
                              alt={detail.menuItemName}
                            />
                            <AvatarFallback className="rounded-md">
                              {detail.menuItemName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{detail.menuItemName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {detail.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {detail.priceAtOrder.toLocaleString('vi-VN')}đ
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {detail.subtotal.toLocaleString('vi-VN')}đ
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex justify-between items-center p-4 border rounded-lg bg-primary/5">
            <span className="font-semibold text-lg">{t('dashboard.table_details.grand_total')}</span>
            <span className="font-bold text-2xl text-primary">
              {order.totalAmount.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
