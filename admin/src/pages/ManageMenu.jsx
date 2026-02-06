import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

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
import { translateMenuStatus } from '@/lib/translations';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import MenuForm from '../components/MenuForm';

const fetchMenuItems = async () => {
  const response = await api.get('/api/menu/all');
  return response.data;
};

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

export default function ManageMenuPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const {
    data: menuItems,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['menuItems'],
    queryFn: fetchMenuItems,
  });


  const addMenuMutation = useMutation({
    mutationFn: createMenuItem,
    onSuccess: () => {
      toast({ title: t('menu_page.success_add_title'), description: t('menu_page.success_add_desc'), duration: 5000 });
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('menu_page.error_title'),
        description: error.response?.data?.message || t('menu_page.error_add_desc'),
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const updateMenuMutation = useMutation({
    mutationFn: updateMenuItem,
    onSuccess: () => {
      toast({ title: t('menu_page.success_update_title'), description: t('menu_page.success_update_desc'), duration: 5000 });
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('menu_page.error_title'),
        description: error.response?.data?.message || t('menu_page.error_update_desc'),
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const deleteMenuMutation = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      toast({ title: t('menu_page.success_delete_title'), description: t('menu_page.success_delete_desc'), duration: 5000 });
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
      setItemToDelete(null);
    },
    onError: (error) => {
      toast({
        title: t('menu_page.error_title'),
        description: error.response?.data?.message || t('menu_page.error_delete_desc'),
        variant: "destructive",
        duration: 5000,
      });
      setItemToDelete(null);
    },
  });

  const handleOpenAddDialog = () => {
    setEditingMenuItem(null);
    setIsFormOpen(true);
  };
  
  const handleOpenEditDialog = (item) => {
    setEditingMenuItem(item);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data) => {
    if (editingMenuItem) {
      updateMenuMutation.mutate({ id: editingMenuItem.id, data });
    } else {
      addMenuMutation.mutate(data);
    }
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      deleteMenuMutation.mutate(itemToDelete.id);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'MÓN';
  };

  const filteredMenuItems = useMemo(() => {
    if (!menuItems) return [];
    
    if (searchTerm.trim()) {
      const search = searchTerm.trim().toLowerCase();
      return menuItems.filter(item => {
        const name = (lang === 'jp' ? item.name_jp : item.name) || '';
        return name.toLowerCase().includes(search);
      });
    }
    
    return menuItems;
  }, [menuItems, searchTerm, lang]);

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">{t('menu_page.title')}</h1>
        <Button onClick={handleOpenAddDialog} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('menu_page.add_new')}
        </Button>
      </div>

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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMenuItem ? t('menu_page.edit_title') : t('menu_page.add_title')}
            </DialogTitle>
            <DialogDescription>
              {t('menu_page.form_desc')}
            </DialogDescription>
          </DialogHeader>
          
          <MenuForm
            onSubmit={handleFormSubmit}
            isLoading={addMenuMutation.isLoading || updateMenuMutation.isLoading}
            initialData={editingMenuItem}
          />
        </DialogContent>
      </Dialog>

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
