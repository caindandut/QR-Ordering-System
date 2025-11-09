import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// Import "linh kiện" (Không cần QrCode, Printer)
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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import CategoryForm from '../components/CategoryForm'; // 👈 Import Form mới

// --- CÁC HÀM GỌI API (Đã đổi tên) ---
const fetchCategories = async () => {
  const response = await api.get('/api/categories');
  return response.data;
};

const createCategory = async (newCategory) => {
  const response = await api.post('/api/categories', newCategory);
  return response.data;
};

const updateCategory = async ({ id, data }) => {
  const response = await api.patch(`/api/categories/${id}`, data);
  return response.data;
};

const deleteCategory = async (id) => {
  await api.delete(`/api/categories/${id}`);
};
// ---

export default function ManageCategoriesPage() {
  // --- STATE QUẢN LÝ UI (Đã đổi tên) ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // --- LOGIC ĐỌC (READ) ---
  const { 
    data: categories, // 👈 Đổi tên
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['categories'], // 👈 Đổi Key
    queryFn: fetchCategories, // 👈 Đổi hàm
  });

  // --- LOGIC TẠO (CREATE) ---
  const addCategoryMutation = useMutation({
    mutationFn: createCategory, // 👈 Đổi hàm
    onSuccess: () => {
      toast({ title: "Thành công!", description: "Đã thêm danh mục mới." }); // 👈 Đổi text
      queryClient.invalidateQueries({ queryKey: ['categories'] }); // 👈 Đổi Key
      setIsFormOpen(false);
    },
    onError: (error) => {
       toast({
        title: "Lỗi!",
        description: error.response?.data?.message || "Không thể thêm danh mục.", // 👈 Đổi text
        variant: "destructive",
      });
    },
  });

  // --- LOGIC SỬA (UPDATE) ---
  const updateCategoryMutation = useMutation({
    mutationFn: updateCategory, // 👈 Đổi hàm
    onSuccess: () => {
      toast({ title: "Thành công!", description: "Đã cập nhật danh mục." }); // 👈 Đổi text
      queryClient.invalidateQueries({ queryKey: ['categories'] }); // 👈 Đổi Key
      setIsFormOpen(false);
    },
    onError: (error) => {
         toast({ 
        title: "Lỗi!",
        description: error.response?.data?.message || "Không thể cập nhật danh mục.", // 👈 Đổi text
        variant: "destructive",
      });
    },
  });
  
  // --- LOGIC XÓA (DELETE) ---
  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory, // 👈 Đổi hàm
    onSuccess: () => {
      toast({ title: "Đã xóa!", description: "Đã xóa danh mục." }); // 👈 Đổi text
      queryClient.invalidateQueries({ queryKey: ['categories'] }); // 👈 Đổi Key
      setCategoryToDelete(null);
    },
    onError: (error) => {
       toast({
        title: "Lỗi!",
        description: error.response?.data?.message || "Không thể xóa danh mục.", // 👈 Đổi text
        variant: "destructive",
      });
      setCategoryToDelete(null);
    },
  });

  // --- HÀM XỬ LÝ SỰ KIỆN (Đã đổi tên) ---
  const handleOpenAddDialog = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };
  
  const handleOpenEditDialog = (category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };
  
  const handleFormSubmit = (data) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      addCategoryMutation.mutate(data);
    }
  };

  const handleDeleteConfirm = () => {
    if (categoryToDelete) {
      deleteCategoryMutation.mutate(categoryToDelete.id);
    }
  };

  if (isLoading) return <div>Đang tải danh mục...</div>;
  if (isError) return <div>Lỗi: {error.message}</div>;

  return (
    <div className="flex flex-col gap-4">
      {/* --- TIÊU ĐỀ & NÚT THÊM --- */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Danh mục</h1>
        <Button onClick={handleOpenAddDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Thêm danh mục
        </Button>
      </div>

      {/* --- DIALOG (Modal) THÊM/SỬA --- */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
            </DialogTitle>
            <DialogDescription>
              Tên danh mục sẽ hiển thị cho khách hàng.
            </DialogDescription>
          </DialogHeader>
          <CategoryForm // 👈 Dùng Form mới
            onSubmit={handleFormSubmit}
            isLoading={addCategoryMutation.isLoading || updateCategoryMutation.isLoading}
            initialData={editingCategory}
          />
        </DialogContent>
      </Dialog>
      
      {/* --- DIALOG (Alert) XÁC NHẬN XÓA --- */}
      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa danh mục 
              <strong className="mx-1">
                {categoryToDelete?.name}
              </strong>.
              (Lưu ý: Bạn không thể xóa danh mục nếu đang có món ăn thuộc về nó).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={deleteCategoryMutation.isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteCategoryMutation.isLoading ? "Đang xóa..." : "Vẫn xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- BẢNG DỮ LIỆU --- */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tên (Tiếng Việt)</TableHead>
              <TableHead>Tên (Tiếng Nhật)</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories && categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.id}</TableCell>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.name_jp}</TableCell>
                <TableCell className="text-right space-x-2">
                  {/* Nút Sửa */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditDialog(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {/* Nút Xóa */}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setCategoryToDelete(category)}
                  >
                    <Trash2 className="h-4 w-4" />
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