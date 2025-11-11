// import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';


export default function CustomerHeader() {
//   const navigate = useNavigate();
  
  const handleLogout = () => {
    // 1. XÓA "PHIÊN" (SESSION) CỦA KHÁCH
    // Xóa mọi thứ ta đã lưu
    localStorage.removeItem('customer_name');
    localStorage.removeItem('table_id');
    localStorage.removeItem('table_name');
    localStorage.removeItem('cart-storage'); // 👈 XÓA CẢ GIỎ HÀNG
    
    // 2. TẢI LẠI TRANG
    // Tác dụng: Đây là cách "reset" ứng dụng đơn giản và
    // an toàn nhất. Nó sẽ buộc OrderGateway chạy lại từ đầu,
    // và vì `customer_name` đã bị xóa, nó sẽ tự động
    // hiển thị Modal (Hộp thoại) nhập tên.
    window.location.reload();
  };
  
  return (
    <header className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
      <h1 className="text-xl font-bold">Nhà hàng</h1>
      
      <div className="flex items-center gap-2">
        {/* (Nút Dark Mode & Ngôn ngữ sẽ ở đây sau) */}
        
        {/* Nút Đăng xuất */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleLogout}
          title="Thoát (Xóa tên của bạn)"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}