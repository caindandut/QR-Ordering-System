import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

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
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import CategoryForm from '../components/CategoryForm';
import { useTranslation } from 'react-i18next';

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

export default function ManageCategoriesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const { 
    data: categories,
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const addCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      toast({ title: t('categories_page.success_add_title'), description: t('categories_page.success_add_desc'), duration: 5000 });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsFormOpen(false);
    },
    onError: (error) => {
       toast({
        title: t('categories_page.error_title'),
        description: error.response?.data?.message || t('categories_page.error_add_desc'),
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      toast({ title: t('categories_page.success_update_title'), description: t('categories_page.success_update_desc'), duration: 5000 });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsFormOpen(false);
    },
    onError: (error) => {
         toast({ 
        title: t('categories_page.error_title'),
        description: error.response?.data?.message || t('categories_page.error_update_desc'),
        variant: "destructive",
        duration: 5000,
      });
    },
  });
  
  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      toast({ title: t('categories_page.success_delete_title'), description: t('categories_page.success_delete_desc'), duration: 5000 });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCategoryToDelete(null);
    },
    onError: (error) => {
       toast({
        title: t('categories_page.error_title'),
        description: error.response?.data?.message || t('categories_page.error_delete_desc'),
        variant: "destructive",
        duration: 5000,
      });
      setCategoryToDelete(null);
    },
  });

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


  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">{t('categories_page.title')}</h1>
        <Button onClick={handleOpenAddDialog} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('categories_page.add_new')}
        </Button>
      </div>

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
          <CategoryForm
            onSubmit={handleFormSubmit}
            isLoading={addCategoryMutation.isLoading || updateCategoryMutation.isLoading}
            initialData={editingCategory}
          />
        </DialogContent>
      </Dialog>
      
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

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="text-center text-red-500 p-8">
          {t('categories_page.error', { message: error.message })}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">ID</TableHead>
                <TableHead>{t('common.name_vi')}</TableHead>
                <TableHead>{t('common.name_jp')}</TableHead>
                <TableHead className="text-right w-32">{t('common.action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!categories || categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    {lang === 'jp' ? 'まだカテゴリがありません' : 'Chưa có danh mục nào'}
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.id}</TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.name_jp}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditDialog(category)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setCategoryToDelete(category)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
