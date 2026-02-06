import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CartButton() {
  const totalItems = useCartStore((state) => state.getTotalItems());
  
  const totalPrice = useCartStore((state) => state.getTotalPrice());

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 md:hidden">
      <Link to="/order/cart"> 
        <Button size="lg" className="shadow-lg">
          <ShoppingCart className="mr-2 h-5 w-5" />
          Xem Giỏ hàng
          
          <Badge variant="secondary" className="ml-2">
            {totalItems}
          </Badge>
          
          <span className="ml-4 font-bold">
            {totalPrice.toLocaleString('vi-VN')}đ
          </span>
        </Button>
      </Link>
    </div>
  );
}
