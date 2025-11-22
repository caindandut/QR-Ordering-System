import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { PlusCircle, Edit, Trash2, Loader2, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import StaffForm from '../components/StaffForm';

const fetchStaff = async () => {
  const response = await api.get('/api/staff'); 
  return response.data;
  
};
const createStaff = async (newStaff) => {
  const response = await api.post('/api/staff', newStaff);
  return response.data;
};
const updateStaff = async ({ id, data }) => {
  const response = await api.patch(`/api/staff/${id}`, data); 
  return response.data;
};
const deleteStaff = async (id) => {
  await api.delete(`/api/staff/${id}`); 
};
// ---

export default function ManageStaffPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  // --- LOGIC ĐỌC (READ) ---
  const { 
    data: staffList,
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['staff'], 
    queryFn: fetchStaff, 
  });

  // --- LOGIC GHI (CREATE) ---
  const addStaffMutation = useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      toast({ title: t('staff_page.success_add_title'), description: t('staff_page.success_add_desc'), duration: 5000 });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('staff_page.error_title'),
        description: error.response?.data?.message || t('staff_page.error_add_desc'),
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  // --- LOGIC SỬA (UPDATE) ---
  const updateStaffMutation = useMutation({
    mutationFn: updateStaff,
    onSuccess: () => {
      toast({ title: t('staff_page.success_update_title'), description: t('staff_page.success_update_desc'), duration: 5000 });
      queryClient.invalidateQueries({ queryKey: ['staff'] }); 
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('staff_page.error_title'),
        description: error.response?.data?.message || t('staff_page.error_update_desc'),
        variant: "destructive",
        duration: 5000,
      });
    },
  });
  
  // --- LOGIC XÓA (DELETE) ---
  const deleteStaffMutation = useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      toast({ title: t('staff_page.success_delete_title'), description: t('staff_page.success_delete_desc'), duration: 5000 });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setStaffToDelete(null);
    },
    onError: (error) => {
      toast({
        title: t('staff_page.error_title'),
        description: error.response?.data?.message || t('staff_page.error_delete_desc'),
        variant: "destructive",
        duration: 5000,
      });
      setStaffToDelete(null);
    },
  });

  // --- HÀM XỬ LÝ SỰ KIỆN ---
  const handleOpenAddDialog = () => {
    setEditingStaff(null);
    setIsFormOpen(true);
  };
  
  const handleOpenEditDialog = (staff) => {
    setEditingStaff(staff);
    setIsFormOpen(true);
  };
  
  const handleFormSubmit = (data) => {
    if (editingStaff) {
      updateStaffMutation.mutate({ id: editingStaff.id, data });
    } else {
      addStaffMutation.mutate(data);
    }
  };

  const handleDeleteConfirm = () => {
    if (staffToDelete) {
      deleteStaffMutation.mutate(staffToDelete.id);
    }
  };

  const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'NV';

  // Filter staff by search term (tìm theo tên, email, hoặc số điện thoại)
  const filteredStaff = useMemo(() => {
    if (!staffList) return [];
    if (!searchTerm.trim()) return staffList;
    
    const search = searchTerm.trim().toLowerCase();
    return staffList.filter((staff) => {
      const name = (staff.name || '').toLowerCase();
      const email = (staff.email || '').toLowerCase();
      const phone = (staff.phone || '').toLowerCase();
      return name.includes(search) || email.includes(search) || phone.includes(search);
    });
  }, [staffList, searchTerm]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">{t('staff_page.title')}</h1>
        <Button onClick={handleOpenAddDialog} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('staff_page.add_new')}
        </Button>
      </div>

      {/* SEARCH SECTION */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="search"
            placeholder={lang === 'jp' ? '名前、メール、電話番号で検索...' : 'Tìm kiếm theo tên, email, số điện thoại...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 text-base"
          />
        </div>
      </div>

      {/* --- DIALOG (Modal) THÊM/SỬA --- */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStaff ? t('staff_page.edit_title') : t('staff_page.add_title')}</DialogTitle>
            <DialogDescription>
              {t('staff_page.form_desc')}
            </DialogDescription>
          </DialogHeader>
          <StaffForm // 👈 Dùng Form "Nhân viên"
            onSubmit={handleFormSubmit}
            isLoading={addStaffMutation.isLoading || updateStaffMutation.isLoading}
            initialData={editingStaff}
          />
        </DialogContent>
      </Dialog>
      
      {/* --- DIALOG (Alert) XÁC NHẬN XÓA --- */}
      <AlertDialog
        open={!!staffToDelete}
        onOpenChange={(open) => !open && setStaffToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('staff_page.delete_desc')} <strong className="mx-1">{staffToDelete?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={deleteStaffMutation.isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteStaffMutation.isLoading ? t('common.deleting') : t('common.confirm_delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* STAFF TABLE */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="text-center text-red-500 p-8">
          {t('staff_page.error', { message: error.message })}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t('staff_page.staff_column')}</TableHead>
                <TableHead>{t('staff_page.email')}</TableHead>
                <TableHead>{t('staff_page.phone')}</TableHead>
                <TableHead>{t('staff_page.role')}</TableHead>
                <TableHead className="text-right w-32">{t('common.action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    {searchTerm.trim()
                      ? (lang === 'jp' ? 'スタッフが見つかりませんでした' : 'Không tìm thấy nhân viên nào')
                      : (t('staff_page.no_staff') || 'Chưa có nhân viên nào')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={staff.avatarUrl} alt={staff.name} />
                          <AvatarFallback>{getInitials(staff.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{staff.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{staff.email}</TableCell>
                    <TableCell>{staff.phone || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={staff.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {staff.role === 'ADMIN' ? t('staff_page.role_admin') : t('staff_page.role_staff')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditDialog(staff)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setStaffToDelete(staff)}
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