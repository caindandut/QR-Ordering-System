import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import ProfileForm from '../components/ProfileForm';
import PasswordForm from '../components/PasswordForm';

const updateProfile = async (data) => {
  const response = await api.patch('/api/auth/me', data);
  return response.data;
};

const changePassword = async (data) => {
  const response = await api.post('/api/auth/change-password', data);
  return response.data;
};

export default function AccountPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // 1. Lấy "hành động" updateUser từ "bộ não"
  const updateUserInStore = useAuthStore((state) => state.updateUser);

  // 2. "Công nhân Sửa" (Update)
  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    
    // 3. "ẢO THUẬT" (onSuccess)
    onSuccess: (data) => {
      // `data` là { user: {...} } trả về từ API
      toast({ title: "Thành công!", description: "Đã cập nhật hồ sơ của bạn." });
      
      // 3a. Cập nhật "bộ não" (Zustand)
      //    -> Header sẽ tự động cập nhật tên mới
      updateUserInStore(data.user); 
      
      // 3b. (Tùy chọn) Làm mới các cache khác nếu cần
      //    (Ví dụ: làm mới 'staff' nếu nó có tồn tại)
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (error) => {
      toast({
        title: "Lỗi!",
        description: error.response?.data?.message || "Không thể cập nhật.",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: (data) => {
      toast({ title: "Thành công!", description: data.message });
      // (Không cần invalidateQueries vì không ảnh hưởng Bảng)
      // (Chúng ta cần 1 cách để reset form con)
    },
    onError: (error) => {
      toast({
        title: "Lỗi đổi mật khẩu!",
        description: error.response?.data?.message || "Không thể đổi mật khẩu.",
        variant: "destructive",
      });
    },
  });

  // 4. Hàm Submit (để truyền cho Form "con")
  const handleProfileSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  const handlePasswordSubmit = (data) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold text-foreground">Tài khoản của tôi</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* --- CARD 1: THÔNG TIN CÁ NHÂN --- */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
            <CardDescription>
              Cập nhật tên, số điện thoại và ảnh đại diện của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 5. Lắp ráp Form */}
            <ProfileForm
              onSubmit={handleProfileSubmit}
              isLoading={updateProfileMutation.isLoading}
            />
          </CardContent>
        </Card>

       <Card>
          <CardHeader>
            <CardTitle>Đổi mật khẩu</CardTitle>
            <CardDescription>
              Thay đổi mật khẩu đăng nhập của bạn. Yêu cầu mật khẩu cũ.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm 
              onSubmit={handlePasswordSubmit}
              isLoading={changePasswordMutation.isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}