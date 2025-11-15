import { useState } from 'react'; // 👈 Thêm useState
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // 👈 Thêm useMutation, useQueryClient
import api from '../services/api';
import { useToast } from "@/hooks/use-toast"; // 👈 Thêm toast
import { useTranslation } from 'react-i18next';

// Import "linh kiện" (như cũ)
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
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
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { translateMenuStatus } from '@/lib/translations'; // 👈 Import từ file dịch

// 👇 1. IMPORT CÁC "LINH KIỆN" MỚI
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import MenuForm from '../components/MenuForm'; // 👈 Import Form "thông minh"

// --- CÁC HÀM GỌI API ---
const fetchMenuItems = async () => {
  const response = await api.get('/api/menu/all');
  return response.data;
};

// 👇 2. CÁC HÀM "GHI" (WRITE) MỚI
const createMenuItem = async (newItem) => {
  const response = await api.post('/api/menu', newItem);
  return response.data;
};

const updateMenuItem = async ({ id, data }) => {
  const response = await api.patch(`/api/menu/${id}`, data);
  return response.data;
};

const deleteMenuItem = async (id) => {
  await api.delete(`/api/menu/${id}`);
};
// ---

export default function ManageMenuPage() {
  // --- STATE QUẢN LÝ UI ---
  // (Giống hệt trang Bàn ăn, chỉ đổi tên biến)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // --- HOOKS ---
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  // --- LOGIC ĐỌC (READ) ---
  const {
    data: menuItems,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['menuItems'],
    queryFn: fetchMenuItems,
  });

  // --- 👇 3. LOGIC GHI (CREATE & UPDATE) ---
  
  // "Công nhân" Thêm
  const addMenuMutation = useMutation({
    mutationFn: createMenuItem,
    onSuccess: () => {
      toast({ title: t('menu_page.success_add_title'), description: t('menu_page.success_add_desc') });
      // "CÂU THẦN CHÚ" LÀM MỚI
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      setIsFormOpen(false); // Đóng Modal
    },
    onError: (error) => {
      toast({
        title: t('menu_page.error_title'),
        description: error.response?.data?.message || t('menu_page.error_add_desc'),
        variant: "destructive",
      });
    },
  });

  // "Công nhân" Sửa
  const updateMenuMutation = useMutation({
    mutationFn: updateMenuItem,
    onSuccess: () => {
      toast({ title: t('menu_page.success_update_title'), description: t('menu_page.success_update_desc') });
      // "CÂU THẦN CHÚ" LÀM MỚI
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      setIsFormOpen(false); // Đóng Modal
    },
    onError: (error) => {
      toast({
        title: t('menu_page.error_title'),
        description: error.response?.data?.message || t('menu_page.error_update_desc'),
        variant: "destructive",
      });
    },
  });

  // 👇 [THÊM MỚI] 4. LOGIC XÓA (DELETE)
  // Đây là "Công nhân Xóa"
  const deleteMenuMutation = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      toast({ title: t('menu_page.success_delete_title'), description: t('menu_page.success_delete_desc') });
      // "Ảo thuật": Tự làm mới bảng
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      setItemToDelete(null); // Đóng Alert Dialog
    },
    onError: (error) => {
      toast({
        title: t('menu_page.error_title'),
        description: error.response?.data?.message || t('menu_page.error_delete_desc'),
        variant: "destructive",
      });
      setItemToDelete(null);
    },
  });

  // --- 👇 4. CÁC HÀM XỬ LÝ SỰ KIỆN (Event Handlers) ---
  const handleOpenAddDialog = () => {
    setEditingMenuItem(null); // `null` = Chế độ Thêm
    setIsFormOpen(true);
  };
  
  const handleOpenEditDialog = (item) => {
    setEditingMenuItem(item); // `object` = Chế độ Sửa
    setIsFormOpen(true);
  };

  // Hàm "ngã rẽ", quyết định gọi công nhân nào
  const handleFormSubmit = (data) => {
    if (editingMenuItem) {
      // Chế độ Sửa
      updateMenuMutation.mutate({ id: editingMenuItem.id, data });
    } else {
      // Chế độ Thêm
      addMenuMutation.mutate(data);
    }
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      deleteMenuMutation.mutate(itemToDelete.id);
    }
  };

  // ... (Xử lý Loading/Error như cũ) ...
  if (isLoading) return <div>{t('menu_page.loading')}</div>;
  if (isError) return <div>{t('menu_page.error', { message: error.message })}</div>;

  // Hàm lấy 2 chữ cái đầu (cho Avatar Fallback)
  const getInitials = (name) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'MÓN';
  };
  
  return (
    <div className="flex flex-col gap-4">
      {/* --- TIÊU ĐỀ & NÚT THÊM --- */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">{t('menu_page.title')}</h1>
        {/* Nút "Thêm" gọi hàm `handleOpenAddDialog` */}
        <Button onClick={handleOpenAddDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('menu_page.add_new')}
        </Button>
      </div>

      {/* --- 👇 5. DIALOG (Modal) THÊM/SỬA --- */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl"> {/* Cho Modal rộng hơn */}
          <DialogHeader>
            <DialogTitle>
              {editingMenuItem ? t('menu_page.edit_title') : t('menu_page.add_title')}
            </DialogTitle>
            <DialogDescription>
              {t('menu_page.form_desc')}
            </DialogDescription>
          </DialogHeader>
          
          {/* Render Form "chuyên gia" */}
          <MenuForm
            onSubmit={handleFormSubmit}
            // Báo loading (từ CẢ 2 "công nhân")
            isLoading={addMenuMutation.isLoading || updateMenuMutation.isLoading}
            // Truyền dữ liệu ban đầu
            initialData={editingMenuItem}
          />
        </DialogContent>
      </Dialog>

      {/* 👇 [THÊM MỚI] 6. ALERT DIALOG ĐỂ XÁC NHẬN XÓA --- */}
      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('menu_page.delete_desc_1')}
              <strong className="mx-1">
                {itemToDelete?.name}
              </strong>. 
              {t('menu_page.delete_desc_2')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={deleteMenuMutation.isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMenuMutation.isLoading ? t('common.deleting') : t('common.confirm_delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- BẢNG DỮ LIỆU --- */}
      <div className="border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.image')}</TableHead>
              <TableHead>{t('menu_page.dish_name')}</TableHead>
              <TableHead>{t('common.price')}</TableHead>
              <TableHead>{t('common.category')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead className="text-right">{t('common.action')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menuItems && menuItems.map((item) => {
              const { text, variant } = translateMenuStatus(item.status, lang);
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Avatar className="h-12 w-12 md:h-20 md:w-20 rounded-md">
                      <AvatarImage 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="object-cover"/>
                      <AvatarFallback>
                        {getInitials(item.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">
                    {lang === 'jp' ? item.name_jp : item.name}
                  </TableCell>
                  <TableCell>
                    {item.price.toLocaleString('vi-VN')}đ
                  </TableCell>
                  <TableCell>
                    {lang === 'jp' 
                      ? (item.category?.name_jp || item.category?.name || 'N/A')
                      : (item.category?.name || 'N/A')
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant={variant}>{text}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {/* Nút "Sửa" gọi hàm `handleOpenEditDialog` */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditDialog(item)}
                    >
                      <Edit className="h-4 w-4" />
                      {/* Sửa */}
                    </Button>
                    <Button
                     variant="destructive" 
                     size="sm"
                     onClick={() => setItemToDelete(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {/* Xóa */}
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