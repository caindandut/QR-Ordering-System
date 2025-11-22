import { useState, useMemo } from 'react'; // 👈 Thêm useState, useMemo
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
import { PlusCircle, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import { translateMenuStatus } from '@/lib/translations'; // 👈 Import từ file dịch
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  
  // State cho search
  const [searchTerm, setSearchTerm] = useState('');

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

  // Hàm lấy 2 chữ cái đầu (cho Avatar Fallback)
  const getInitials = (name) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'MÓN';
  };

  // Filter menu items by search term
  const filteredMenuItems = useMemo(() => {
    if (!menuItems) return [];
    
    // Filter by search term (tìm theo tên món)
    if (searchTerm.trim()) {
      const search = searchTerm.trim().toLowerCase();
      return menuItems.filter(item => {
        const name = (lang === 'jp' ? item.name_jp : item.name) || '';
        return name.toLowerCase().includes(search);
      });
    }
    
    return menuItems;
  }, [menuItems, searchTerm, lang]);

  // Early returns phải đặt SAU tất cả các hooks
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isError) return <div>{t('menu_page.error', { message: error.message })}</div>;
  
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">{t('menu_page.title')}</h1>
        {/* Nút "Thêm" gọi hàm `handleOpenAddDialog` */}
        <Button onClick={handleOpenAddDialog} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('menu_page.add_new')}
        </Button>
      </div>

      {/* SEARCH SECTION */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="search"
            placeholder={lang === 'jp' ? '料理名で検索...' : 'Tìm kiếm món ăn...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 text-base"
          />
        </div>
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
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">{t('common.image')}</TableHead>
              <TableHead className="min-w-[200px]">{t('menu_page.dish_name')}</TableHead>
              <TableHead className="w-[120px]">{t('common.price')}</TableHead>
              <TableHead className="min-w-[150px]">{t('common.category')}</TableHead>
              <TableHead className="w-[120px]">{t('common.status')}</TableHead>
              <TableHead className="text-right w-[120px]">{t('common.action')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMenuItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  {searchTerm.trim()
                    ? (lang === 'jp' ? '料理が見つかりませんでした' : 'Không tìm thấy món ăn nào')
                    : (lang === 'jp' ? 'まだ料理がありません' : 'Chưa có món ăn nào')}
                </TableCell>
              </TableRow>
            ) : (
              filteredMenuItems.map((item) => {
              const { text, variant } = translateMenuStatus(item.status, lang);
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Avatar className="h-12 w-12 sm:h-16 sm:w-16 rounded-md">
                      <AvatarImage 
                        src={item.imageUrl} 
                        alt={lang === 'jp' ? item.name_jp : item.name} 
                        className="object-cover"
                      />
                      <AvatarFallback className="text-xs">
                        {getInitials(lang === 'jp' ? item.name_jp : item.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="font-semibold">{lang === 'jp' ? item.name_jp : item.name}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {lang === 'jp' ? item.description_jp : item.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {item.price.toLocaleString('vi-VN')}đ
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {lang === 'jp' 
                        ? (item.category?.name_jp || item.category?.name || 'N/A')
                        : (item.category?.name || 'N/A')
                      }
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={variant}>{text}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {/* Nút "Sửa" gọi hàm `handleOpenEditDialog` */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditDialog(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Sửa</span>
                      </Button>
                      <Button
                        variant="destructive" 
                        size="sm"
                        onClick={() => setItemToDelete(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Xóa</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}