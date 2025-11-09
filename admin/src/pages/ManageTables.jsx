import { useState, useRef } from 'react'; // 👈 Thêm useState
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api'; 
import { QRCode } from 'react-qrcode-logo';
import { useReactToPrint } from 'react-to-print';

// 1. Import "linh kiện"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useToast } from "@/hooks/use-toast"; // 👈 Import toast
import { PlusCircle, Edit, Trash2, QrCode, Check, Printer, Copy } from 'lucide-react';
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

// 👇 HÀM MỚI: Xóa bàn (Chỉ cần ID)
const deleteTable = async (id) => {
  await api.delete(`/api/tables/${id}`);
};

// Lấy URL của Ứng dụng Khách từ .env
const CUSTOMER_APP_URL = import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:5174';

export default function ManageTablesPage() {
  // --- STATE QUẢN LÝ ---
  // 1. Dùng 1 state để mở/đóng Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // 2. Dùng 1 state để biết "đang sửa bàn nào"
  //    Nếu `null`: là chế độ Thêm mới
  //    Nếu có object `table`: là chế độ Sửa
  const [editingTable, setEditingTable] = useState(null);

  // 👇 2. STATE MỚI: "Bộ nhớ tạm" cho việc Xóa
  const [tableToDelete, setTableToDelete] = useState(null);

  // 👇 3. STATE MỚI: "Bộ nhớ tạm" cho QR Code
  //    (Lưu bàn đang được chọn để xem QR)
  const [qrCodeTable, setQrCodeTable] = useState(null);

  const qrCodeRef = useRef(null);

  const [isCopied, setIsCopied] = useState(false);
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

  // 👇 3. LOGIC MỚI: (DELETE)
  // Đây là "Công nhân Xóa"
  const deleteTableMutation = useMutation({
    mutationFn: deleteTable,
    onSuccess: () => {
      toast({ title: "Đã xóa!", description: "Đã xóa bàn thành công." });
      // 4. "Ảo thuật": Tự làm mới bảng
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setTableToDelete(null); // Đóng Alert Dialog
    },
    onError: (error) => {
      toast({
        title: "Lỗi!",
        description: error.response?.data?.message || "Không thể xóa bàn.",
        variant: "destructive",
      });
      setTableToDelete(null); // Đóng Alert Dialog
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

  // 👇 5. HÀM MỚI: Khi nhấn "Xác nhận Xóa"
  const handleDeleteConfirm = () => {
    if (tableToDelete) {
      deleteTableMutation.mutate(tableToDelete.id);
    }
  };

  // 👇 2. TẠO "NÚT BẤM MÁY IN" (Hook)
  const handlePrint = useReactToPrint({
    // 2a. Truyền ref trực tiếp (KHÔNG phải callback)
    contentRef: qrCodeRef,
    // 2b. Tên file khi lưu PDF
    documentTitle: `QR-Ban-${qrCodeTable?.name || 'qr-code'}`,
    // 2c. (Tùy chọn) Thông báo sau khi in
    onAfterPrint: () => toast({ title: "Đã gửi lệnh in!" }),
  });

  // --- XỬ LÝ TRẠNG THÁI LOADING/ERROR ---
  if (isLoading) {
    return <div>Đang tải dữ liệu bàn...</div>;
  }
  if (isError) {
    return <div>Lỗi: {error.message}</div>;
  }

  // 👇 4. Xây dựng chuỗi URL cho QR Code
  //    Nó sẽ tự động tính toán lại khi `qrCodeTable` thay đổi
  const qrUrl = qrCodeTable 
    ? `${CUSTOMER_APP_URL}/order?table_id=${qrCodeTable.id}`
    : '';

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

            <DialogDescription>
              Điền thông tin chi tiết cho bàn. Nhấn "Lưu" khi hoàn thành.
            </DialogDescription>

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

      {/* 👇 6. ALERT DIALOG (Hộp thoại) ĐỂ XÁC NHẬN XÓA --- */}
      {/* Nó nằm ở đây (ngoài bảng), nhưng vô hình */}
      <AlertDialog
        // 6a. Tự mở/đóng dựa trên state `tableToDelete`
        open={!!tableToDelete}
        onOpenChange={(open) => !open && setTableToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn bàn
              <strong className="mx-1">
                {tableToDelete?.name}
              </strong>. 
              Bạn không thể hoàn tác hành động này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {/* 6b. Nút Hủy: Đặt state về null để đóng */}
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            {/* 6c. Nút Xác nhận: Gọi hàm xóa */}
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={deleteTableMutation.isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTableMutation.isLoading ? "Đang xóa..." : "Vẫn xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 👇 5. DIALOG MỚI: ĐỂ HIỂN THỊ QR CODE --- */}
      <Dialog
        open={!!qrCodeTable}
        onOpenChange={(open) => {
          if (!open) {
            setQrCodeTable(null); // Đóng Dialog
            setIsCopied(false);   // Reset trạng thái copy
          }
        }}
      >
        <DialogContent className="max-w-xs p-0">
          <DialogHeader className="p-6 pb-2"> {/* Thêm padding cho Header */}
            <DialogTitle className="text-center">
              Mã QR: {qrCodeTable?.name}
            </DialogTitle>

            <DialogDescription className="text-center">
              Dùng mã này để khách hàng quét và gọi món tại bàn.
            </DialogDescription>
            
          </DialogHeader>
          <div 
           ref={qrCodeRef} className="flex flex-col items-center justify-center p-6 pt-0">
            <h3 className="hidden print:block print:text-black text-2xl font-bold mb-4">
              {qrCodeTable?.name}
            </h3>
             <p className="hidden print:block print:text-black text-sm mb-4">
              Quét mã để đặt món bằng Camera/Zalo
            </p>
            {/* 6. "Vẽ" QR Code */}
            <QRCode
              value={qrUrl} // 👈 Giá trị (URL)
              size={250}   // Kích thước
              logoImage="/logo.svg" // 👈 (Tùy chọn) Đường dẫn tới logo
                                    // (Đặt file logo vào thư mục `public/`)
              logoWidth={60}
              logoHeight={60}
            />
          </div>
          <div className="p-6 pt-0 flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full" // 👈 Thêm w-full để nó đẹp
              disabled={isCopied}
              onClick={async () => {
                if (!qrUrl) return;
                try {
                  // 1. Dùng API Clipboard
                  await navigator.clipboard.writeText(qrUrl);
                  
                  // 2. Cập nhật state
                  setIsCopied(true);
                  
                  // 3. (Tùy chọn) Reset lại sau 2 giây
                  setTimeout(() => setIsCopied(false), 2000);
                  
                } catch (err) {
                  console.error('Không thể copy URL: ', err);
                }
              }}
            >
              {isCopied ? (
                <Check className="mr-2 h-4 w-4 text-green-500" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {isCopied ? 'Đã copy!' : 'Copy URL'}
            </Button>

            <Button
              onClick={handlePrint}
              className="w-full"
            >
              <Printer className="mr-2 h-4 w-4" />
              In mã QR
            </Button>
          </div>
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
                <TableCell className="text-right space-x-3">

                  {/* 👇 7. NÚT MỚI: MỞ MODAL QR CODE */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-500 hover:text-blue-700"
                    // Chỉ "ghi" vào state, không gọi API
                    onClick={() => setQrCodeTable(table)}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>

                  <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleOpenEditDialog(table)}
                  >
                    <Edit className="mr-1 h-4 w-4" />
                    {/* Sửa */}
                  </Button>

                  {/* 👇 7. NÚT XÓA MỚI */}
                  <Button
                    variant="destructive"
                    size="sm"
                    // 7a. Chỉ "ghi" vào state, không gọi API
                    onClick={() => setTableToDelete(table)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    {/* Xóa */}
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