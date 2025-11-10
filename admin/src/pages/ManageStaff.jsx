import { useState } from 'react';
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
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      toast({ title: "Thành công!", description: "Đã thêm nhân viên mới." });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Lỗi!",
        description: error.response?.data?.message || "Không thể thêm nhân viên.",
        variant: "destructive",
      });
    },
  });

  // --- LOGIC SỬA (UPDATE) ---
  const updateStaffMutation = useMutation({
    mutationFn: updateStaff,
    onSuccess: () => {
      toast({ title: "Thành công!", description: "Đã cập nhật nhân viên." });
      queryClient.invalidateQueries({ queryKey: ['staff'] }); 
      setIsFormOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Lỗi!",
        description: error.response?.data?.message || "Không thể cập nhật nhân viên.",
        variant: "destructive",
      });
    },
  });
  
  // --- LOGIC XÓA (DELETE) ---
  const deleteStaffMutation = useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      toast({ title: "Đã xóa!", description: "Đã xóa nhân viên." });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setStaffToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Lỗi!",
        description: error.response?.data?.message || "Không thể xóa nhân viên.",
        variant: "destructive",
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

  if (isLoading) return <div>Đang tải danh sách nhân viên...</div>;
  if (isError) return <div>Lỗi: {error.message}</div>;

  const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'NV';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Nhân viên</h1>
        <Button onClick={handleOpenAddDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Thêm nhân viên
        </Button>
      </div>

      {/* --- DIALOG (Modal) THÊM/SỬA --- */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Sửa nhân viên' : 'Thêm nhân viên mới'}</DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết cho nhân viên.
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
            <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa nhân viên <strong className="mx-1">{staffToDelete?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={deleteStaffMutation.isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteStaffMutation.isLoading ? "Đang xóa..." : "Vẫn xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- BẢNG DỮ LIỆU --- */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhân viên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>SĐT</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffList && staffList.map((staff) => (
              <TableRow key={staff.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={staff.avatarUrl} alt={staff.name} />
                    <AvatarFallback>{getInitials(staff.name)}</AvatarFallback>
                  </Avatar>
                  {staff.name}
                </TableCell>
                <TableCell>{staff.email}</TableCell>
                <TableCell>{staff.phone || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={staff.role === 'ADMIN' ? 'default' : 'secondary'}>
                    {staff.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(staff)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setStaffToDelete(staff)}>
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