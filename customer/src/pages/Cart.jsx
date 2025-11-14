import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore'; 
import { useMutation } from '@tanstack/react-query';
import api from '../services/api.js';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus, Trash2, ArrowLeft } from 'lucide-react';


const placeOrder = async (orderData) => {
  const response = await api.post('/api/orders', orderData);
  return response.data;
};
// ---

export default function CartPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // 3. LẤY TẤT CẢ TỪ "BỘ NÃO" ZUSTAND
  //    (Dùng "selector" để tối ưu)
  const items = useCartStore((state) => state.items);
  const incrementItem = useCartStore((state) => state.incrementItem);
  const decrementItem = useCartStore((state) => state.decrementItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  // 4. DÙNG `useMemo` ĐỂ TÍNH TOÁN (Tối ưu)
  //    (Giống `getTotalItems` và `getTotalPrice`
  //     nhưng `useMemo` sẽ tự động cập nhật khi `items` thay đổi)
  const totalPrice = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  );
  
  // 5. "CÔNG NHÂN ĐẶT MÓN" (useMutation)
  const placeOrderMutation = useMutation({
    mutationFn: placeOrder,
    
    // 6. "ẢO THUẬT" KHI THÀNH CÔNG (onSuccess)
    onSuccess: (data) => { // `data` là `newOrder` trả về từ API 
      toast({
        title: "Đặt món thành công!",
        description: "Đơn hàng của bạn đã được gửi đến bếp.",
      });
      
      // 6a. XÓA SẠCH giỏ hàng
      clearCart();
      
      // 6b. CHUYỂN HƯỚNG sang trang Theo dõi Đơn hàng
      //    (Chúng ta sẽ tạo trang /order/status ở Giai đoạn 3.5)
      navigate(`/order/status/${data.id}`); 
    },
    onError: (error) => {
      toast({
        title: "Đặt món thất bại!",
        description: error.message || "Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // 7. HÀM SUBMIT
  const handlePlaceOrder = () => {
    // 7a. Lấy dữ liệu từ "bộ não" (Zustand) và localStorage
    const table_id = localStorage.getItem('table_id');
    const customer_name = localStorage.getItem('customer_name');
    
    // 7b. Định dạng lại dữ liệu `items` cho API
    const formattedItems = items.map(item => ({
      item_id: item.id,
      quantity: item.quantity,
    }));
    
    // 7c. "Giao việc" cho "Công nhân"
    placeOrderMutation.mutate({
      table_id,
      customer_name,
      items: formattedItems,
    });
  };

  // Nếu giỏ hàng trống
  if (items.length === 0) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold">Giỏ hàng của bạn đang trống</h1>
        <Button onClick={() => navigate('/order')} className="mt-4">
          Quay lại Thực đơn
        </Button>
      </div>
    );
  }

  // Nếu có giỏ hàng
  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-4xl font-bold">Giỏ hàng của bạn</h3>
        
        {/* Nút "Thêm món" (Quay lại Menu) */}
        <Button asChild variant="outline">
          <Link to="/order">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Thêm món
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết đơn hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 8. LẶP (MAP) QUA CÁC MÓN TRONG "BỘ NÃO" */}
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              {/* (Bên trái: Thông tin) */}
              <div className="flex items-center gap-4">
                <img 
                  src={item.imageUrl} 
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.price.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>
              
              {/* (Bên phải: Nút điều khiển) */}
              <div className="flex items-center gap-3">
                {/* 9. KẾT NỐI HÀNH ĐỘNG CỦA "BỘ NÃO" */}
                <Button variant="outline" size="icon" onClick={() => decrementItem(item.id)}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-bold w-4 text-center">{item.quantity}</span>
                <Button variant="outline" size="icon" onClick={() => incrementItem(item.id)}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => removeItem(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex flex-col items-end gap-4">
          <div className="text-2xl font-bold">
            Tổng cộng: {totalPrice.toLocaleString('vi-VN')}đ
          </div>
          <Button 
            size="lg" 
            onClick={handlePlaceOrder}
            disabled={placeOrderMutation.isLoading}
          >
            {placeOrderMutation.isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {placeOrderMutation.isLoading ? 'Đang gửi bếp...' : 'Xác nhận Đặt món'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}