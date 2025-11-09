// src/pages/ManageMenu.jsx
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

// 1. Import "linh kiện"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { translateMenuStatus } from '@/lib/translations'; // 👈 Import hàm "dịch" mới

// 2. Định nghĩa hàm "lấy" (Fetch)
// TẠI SAO GỌI /api/menu/all?
// Tác dụng: API này (Giai đoạn 1) đã được code để `include` (kèm theo)
// thông tin Category. Chúng ta không cần gọi API lần 2.
const fetchMenuItems = async () => {
  const response = await api.get('/api/menu/all'); // Lấy TẤT CẢ (kể cả món ẩn)
  return response.data;
};

// --- Component chính ---
export default function ManageMenuPage() {
  
  // 3. "Móc" (Hook) useQuery
  const {
    data: menuItems,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['menuItems'], // 👈 Tên "ngăn kéo" cache mới
    queryFn: fetchMenuItems,
  });

  // 4. Xử lý trạng thái Loading/Error
  if (isLoading) {
    return <div>Đang tải dữ liệu món ăn...</div>;
  }
  if (isError) {
    return <div>Lỗi: {error.message}</div>;
  }

  // Hàm lấy 2 chữ cái đầu (cho Avatar Fallback)
  const getInitials = (name) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'MÓN';
  };

  // 5. Render (Hiển thị)
  return (
    <div className="flex flex-col gap-4">
      {/* --- TIÊU ĐỀ & NÚT THÊM --- */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Món ăn</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Thêm món ăn mới
        </Button>
      </div>

      {/* --- BẢNG DỮ LIỆU --- */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ảnh</TableHead>
              <TableHead>Tên món</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menuItems && menuItems.map((item) => {
              // 6. "Dịch" trạng thái
              const { text, variant } = translateMenuStatus(item.status, 'vi');
              
              return (
                <TableRow key={item.id}>
                  {/* 7. Dùng <Avatar> */}
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={item.imageUrl} alt={item.name} />
                      <AvatarFallback>{getInitials(item.name)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  
                  <TableCell className="font-medium">{item.name}</TableCell>
                  
                  <TableCell>
                    {item.price.toLocaleString('vi-VN')}đ
                  </TableCell>
                  
                  {/* 8. Dùng data liên quan (category?.name) */}
                  <TableCell>{item.category?.name || 'N/A'}</TableCell>
                  
                  {/* 9. Dùng <Badge> */}
                  <TableCell>
                    <Badge variant={variant}>{text}</Badge>
                  </TableCell>
                  
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}