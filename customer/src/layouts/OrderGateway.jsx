import { useState, useEffect } from 'react';
import { useSearchParams, Outlet, Navigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function OrderGateway() {
  // `useSearchParams` là "Đầu đọc Thẻ"
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table_id'); // Lấy `table_id` từ URL

  // 2. KIỂM TRA "PHIÊN" (localStorage)
  const [customerName, setCustomerName] = useState(
    () => localStorage.getItem('customer_name') || null
  );
  
  // 3. State cho Modal (Hộp thoại)
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    // 4. KIỂM TRA LOGIC
    if (tableId) {
      // Nếu có ID Bàn
      // 4a. Lưu ID Bàn vào localStorage để dùng sau
      localStorage.setItem('table_id', tableId);
      
      // 4b. Kiểm tra xem đã có tên chưa
      if (!customerName) {
        // Nếu chưa có tên -> Mở Modal bắt nhập tên
        setIsNameDialogOpen(true);
      }
    }
    // Nếu không có tableId (sẽ xử lý ở Bước 5)
  }, [tableId, customerName]); // Chạy lại khi 2 giá trị này thay đổi

  // 5. XỬ LÝ KHI NHẬP TÊN
  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (tempName) {
      // 5a. Lưu tên vào localStorage
      localStorage.setItem('customer_name', tempName);
      // 5b. Cập nhật state (để component render lại)
      setCustomerName(tempName);
      // 5c. Đóng Modal
      setIsNameDialogOpen(false);
    }
  };

  // 6. LOGIC "CỔNG VÀO"

  // 6a. LỖI: Nếu vào mà không có `table_id`
  if (!tableId) {
    // (Sau này có thể thay bằng 1 trang 404 đẹp)
    return <div className="p-4 text-red-500">Lỗi: Vui lòng quét lại mã QR của bàn.</div>;
  }
  
  // 6b. CHỜ NHẬP TÊN: Nếu có `table_id` nhưng CHƯA có tên
  if (tableId && !customerName) {
    return (
      <Dialog open={isNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chào mừng đến với nhà hàng </DialogTitle>
            <DialogDescription>
              Vui lòng nhập tên của bạn để bắt đầu gọi món.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên của bạn</Label>
              <Input
                id="name"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">Bắt đầu</Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
  
  // 6c. THÀNH CÔNG: Nếu CÓ `table_id` và CÓ `customerName`
  //    Cho phép render các trang con (Menu, Giỏ hàng...)
  return <Outlet />;
}