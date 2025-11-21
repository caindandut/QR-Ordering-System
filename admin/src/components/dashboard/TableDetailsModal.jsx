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
import { vi } from 'date-fns/locale';
import { translateOrderStatus } from '@/lib/translations';

export default function TableDetailsModal({ isOpen, onClose, table }) {
  if (!table || !table.currentOrder) {
    return null;
  }

  const order = table.currentOrder;

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
              {table.capacity} chỗ
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Chi tiết đơn hàng hiện tại
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
            <div>
              <div className="text-sm text-muted-foreground">Khách hàng</div>
              <div className="font-semibold">{order.customerName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Thời gian đặt</div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="text-sm">
                  {format(new Date(order.createdAt), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Trạng thái</div>
              <Badge variant={getStatusVariant(order.status)}>
                {translateOrderStatus(order.status, 'vi').text}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Tổng tiền</div>
              <div className="font-bold text-primary">
                {order.totalAmount.toLocaleString('vi-VN')}đ
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Danh sách món ăn</h4>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Món ăn</TableHead>
                    <TableHead className="text-center">SL</TableHead>
                    <TableHead className="text-right">Đơn giá</TableHead>
                    <TableHead className="text-right">Thành tiền</TableHead>
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
            <span className="font-semibold text-lg">Tổng cộng</span>
            <span className="font-bold text-2xl text-primary">
              {order.totalAmount.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
