// src/pages/ManageTables.jsx
import { useState } from 'react'; // 👈 Thêm useState
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast"; // 👈 Import toast
import { PlusCircle, Edit } from 'lucide-react';
import { translateTableStatus } from '@/lib/translations'; // 👈 Import hàm "dịch"
import TableForm from '../components/TableForm'; // 👈 Import Form của chúng ta

// Hàm "lấy" dữ liệu (không đổi)
const fetchTables = async () => {
  const response = await api.get('/api/tables');
  return response.data;
};

// Hàm "gửi" (TẠO MỚI) dữ liệu
// `newTable` là object (ví dụ: { name: "Bàn 1", capacity: 4 })
const createTable = async (newTable) => {
  const response = await api.post('/api/tables', newTable);
  return response.data;
};

// 👇 HÀM MỚI: Sửa bàn (Cần cả ID và Dữ liệu)
const updateTable = async ({ id, data }) => {
  const response = await api.patch(`/api/tables/${id}`, data);
  return response.data;
};

export default function ManageTablesPage() {
  // --- STATE QUẢN LÝ ---
  // 1. Dùng 1 state để mở/đóng Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // 2. Dùng 1 state để biết "đang sửa bàn nào"
  //    Nếu `null`: là chế độ Thêm mới
  //    Nếu có object `table`: là chế độ Sửa
  const [editingTable, setEditingTable] = useState(null);
  // 2. Lấy "Bộ não tổng"
  const queryClient = useQueryClient();
  
  // 3. Lấy hook "thông báo"
  const { toast } = useToast();

  // --- LOGIC ĐỌC (READ) ---
  const {
    data: tables,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['tables'],
    queryFn: fetchTables,
  });

  // --- LOGIC GHI (CREATE) ---
  // 4. Đây là "Công nhân" (useMutation)
  const addTableMutation = useMutation({
    mutationFn: createTable, // 👈 Ra lệnh cho nó dùng hàm `createTable`
    
    // 5. "ẢO THUẬT" TỰ CẬP NHẬT
    onSuccess: () => {
      toast({
        title: "Thành công!",
        description: "Đã thêm bàn mới thành công.",
        duration: 3000
      });
      // 5a. BÁO CHO `useQuery` BIẾT DỮ LIỆU ĐÃ CŨ
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      // 5b. ĐÓNG MODAL LẠI
      setIsDialogOpen(false);
    },
    
    onError: (error) => {
      toast({
        title: "Lỗi!",
        description: error.response?.data?.message || "Không thể thêm bàn.",
        variant: "destructive",
      });
    },
  });
// --- 👇 LOGIC MỚI: (UPDATE) ---
  const updateTableMutation = useMutation({
    mutationFn: updateTable,
    onSuccess: () => {
      toast({ 
        title: "Thành công!",
        description: "Đã cập nhật bàn.",
        duration: 3000 
      });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setIsDialogOpen(false); // Đóng Dialog
    },
    onError: (error) => {
      toast({
        title: "Lỗi!",
        description: error.response?.data?.message || "Không thể cập nhật.",
        variant: "destructive",
      });
    },
  });

  // --- HÀM XỬ LÝ SỰ KIỆN ---
  
  // 1. Khi nhấn nút "Thêm bàn mới"
  const handleOpenAddDialog = () => {
    setEditingTable(null); // Đặt về null (chế độ Thêm)
    setIsDialogOpen(true);
  };
  
  // 2. Khi nhấn nút "Sửa"
  const handleOpenEditDialog = (table) => {
    setEditingTable(table); // Đặt bàn đang sửa
    setIsDialogOpen(true);
  };
  
  // 3. Khi Form được submit
  const handleFormSubmit = (data) => {
    if (editingTable) {
      // Nếu là chế độ Sửa
      updateTableMutation.mutate({ id: editingTable.id, data });
    } else {
      // Nếu là chế độ Thêm
      addTableMutation.mutate(data);
    }
  };
  // --- XỬ LÝ TRẠNG THÁI LOADING/ERROR ---
  if (isLoading) {
    return <div>Đang tải dữ liệu bàn...</div>;
  }
  if (isError) {
    return <div>Lỗi: {error.message}</div>;
  }

  // --- RENDER (HIỂN THỊ) ---
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Bàn ăn</h1>
        {/* Nút "Thêm" bây giờ gọi hàm riêng */}
        <Button onClick={handleOpenAddDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Thêm bàn mới
        </Button>
        {/* --- DIALOG (Modal) THÔNG MINH --- */}
      {/* Nó dùng chung 1 state `isDialogOpen`.
        Nó đóng khi `onOpenChange(false)`
      */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            {/* Tiêu đề thay đổi động (dynamic) */}
            <DialogTitle>
              {editingTable ? 'Sửa bàn ăn' : 'Thêm bàn ăn mới'}
            </DialogTitle>
          </DialogHeader>
          <TableForm
            // Truyền hàm submit "thông minh"
            onSubmit={handleFormSubmit}
            // Báo loading (từ CẢ 2 mutation)
            isLoading={addTableMutation.isLoading || updateTableMutation.isLoading}
            // Truyền dữ liệu ban đầu
            initialData={editingTable}
          />
        </DialogContent>
      </Dialog>
        
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
            {tables.map((table) => (
              <TableRow key={table.id}>
                <TableCell>{table.id}</TableCell>
                <TableCell className="font-medium">{table.name}</TableCell>
                <TableCell>{table.capacity}</TableCell>
                {/* 8. Dùng hàm "dịch" (bạn cần thêm vào `lib/utils.js`) */}
                <TableCell>
                  {translateTableStatus(table.status, 'vi')}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleOpenEditDialog(table)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
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