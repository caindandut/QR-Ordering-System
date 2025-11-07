// src/pages/ManageTables.jsx
import { useQuery } from '@tanstack/react-query';
import api from '../services/api'; // "Đường ống" Axios của chúng ta
import { translateTableStatus } from '@/lib/translations';

// 1. Import các "linh kiện" Table của Shadcn
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

// 2. Định nghĩa hàm "lấy dữ liệu"
//    (Hàm này sẽ được React Query gọi)
const fetchTables = async () => {
  const response = await api.get('/api/tables');
  return response.data;
};

// 3. Component chính
export default function ManageTablesPage() {
  // 4. "Cái móc" (Hook) useQuery
  // TẠI SAO DÙNG `useQuery`?
  // Tác dụng: Nó "móc" vào "trợ lý" React Query và nói:
  // - queryKey: ['tables']  -> Tên của "ngăn kéo" lưu dữ liệu này là 'tables'
  // - queryFn: fetchTables -> Nếu không có gì trong ngăn kéo (hoặc cũ quá),
  //                           hãy chạy hàm 'fetchTables' này để lấy.
  const { 
    data: tables, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['tables'],
    queryFn: fetchTables,
  });

  // 5. Xử lý trạng thái Loading (Đang tải)
  if (isLoading) {
    return <div>Đang tải dữ liệu bàn...</div>;
  }

  // 6. Xử lý trạng thái Lỗi
  if (isError) {
    return <div>Lỗi: {error.message}</div>;
  }

  // 7. Render (Hiển thị)
  return (
    <div className="flex flex-col gap-4">
      {/* --- TIÊU ĐỀ & NÚT THÊM --- */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Bàn ăn</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Thêm bàn mới
        </Button>
      </div>

      {/* --- BẢNG DỮ LIỆU --- */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tên bàn</TableHead>
              <TableHead>Sức chứa</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* 8. Dùng .map() để lặp qua dữ liệu */}
            {tables.map((table) => (
              <TableRow key={table.id}>
                <TableCell>{table.id}</TableCell>
                <TableCell className="font-medium">{table.name}</TableCell>
                <TableCell>{table.capacity}</TableCell>
                <TableCell>{translateTableStatus(table.status, 'vi')}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    Sửa
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}