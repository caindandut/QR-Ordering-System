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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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
    mutationFn: createCategory,
    onSuccess: () => {
      toast({ title: t('categories_page.success_add_title'), description: t('categories_page.success_add_desc') });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsFormOpen(false);
    },
    onError: (error) => {
       toast({
        title: t('categories_page.error_title'),
        description: error.response?.data?.message || t('categories_page.error_add_desc'),
        variant: "destructive",
      });
    },
  });

  // --- LOGIC SỬA (UPDATE) ---
  const updateCategoryMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      toast({ title: t('categories_page.success_update_title'), description: t('categories_page.success_update_desc') });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsFormOpen(false);
    },
    onError: (error) => {
         toast({ 
        title: t('categories_page.error_title'),
        description: error.response?.data?.message || t('categories_page.error_update_desc'),
        variant: "destructive",
      });
    },
  });
  
  // --- LOGIC XÓA (DELETE) ---
  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      toast({ title: t('categories_page.success_delete_title'), description: t('categories_page.success_delete_desc') });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCategoryToDelete(null);
    },
    onError: (error) => {
       toast({
        title: t('categories_page.error_title'),
        description: error.response?.data?.message || t('categories_page.error_delete_desc'),
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

  if (isLoading) return <div>{t('categories_page.loading')}</div>;
  if (isError) return <div>{t('categories_page.error', { message: error.message })}</div>;

  return (
    <div className="flex flex-col gap-4">
      {/* --- TIÊU ĐỀ & NÚT THÊM --- */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">{t('categories_page.title')}</h1>
        <Button onClick={handleOpenAddDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('categories_page.add_new')}
        </Button>
      </div>

      {/* --- DIALOG (Modal) THÊM/SỬA --- */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? t('categories_page.edit_title') : t('categories_page.add_title')}
            </DialogTitle>
            <DialogDescription>
              {t('categories_page.form_desc')}
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
            <AlertDialogTitle>{t('common.are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('categories_page.delete_desc_1')}
              <strong className="mx-1">
                {categoryToDelete?.name}
              </strong>.
              {t('categories_page.delete_desc_2')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={deleteCategoryMutation.isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteCategoryMutation.isLoading ? t('common.deleting') : t('common.confirm_delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- BẢNG DỮ LIỆU --- */}
      <div className="border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>{t('common.name_vi')}</TableHead>
              <TableHead>{t('common.name_jp')}</TableHead>
              <TableHead className="text-right">{t('common.action')}</TableHead>
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