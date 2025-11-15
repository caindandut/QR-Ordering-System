import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CartButton() {
  // 1. DÙNG "BỘ CHỌN" (Selector)
  //    Component này chỉ "lắng nghe" TỔNG SỐ MÓN
  const totalItems = useCartStore((state) => state.getTotalItems());
  
  // 2. DÙNG "BỘ CHỌN" (Selector) thứ hai
  const totalPrice = useCartStore((state) => state.getTotalPrice());

  // Chỉ hiện nút nếu có hàng
  if (totalItems === 0) {
    return null;
  }

  return (
    // 3. Nút "nổi" cố định ở góc
    <div className="fixed bottom-4 right-4 z-50 md:hidden">
      <Link to="/order/cart"> 
        <Button size="lg" className="shadow-lg">
          <ShoppingCart className="mr-2 h-5 w-5" />
          Xem Giỏ hàng
          
          {/* Huy hiệu (Badge) hiển thị tổng số món */}
          <Badge variant="secondary" className="ml-2">
            {totalItems}
          </Badge>
          
          {/* Hiển thị tổng tiền */}
          <span className="ml-4 font-bold">
            {totalPrice.toLocaleString('vi-VN')}đ
          </span>
        </Button>
      </Link>
    </div>
  );
}