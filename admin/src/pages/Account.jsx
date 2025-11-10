import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
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
const updateProfile = async (data) => {
  const response = await api.patch('/api/auth/me', data);
  return response.data;
};
// ---

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

  // 4. Hàm Submit (để truyền cho Form "con")
  const handleProfileSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Tài khoản của tôi</h1>
      
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

        {/* --- CARD 2: ĐỔI MẬT KHẨU (Sẽ làm ở bước 2.8.3) --- */}
        <Card>
          <CardHeader>
            <CardTitle>Đổi mật khẩu</CardTitle>
            <CardDescription>
              Thay đổi mật khẩu đăng nhập của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* (Chúng ta sẽ tạo <PasswordForm /> ở đây) */}
            <p>(Form đổi mật khẩu sẽ ở đây)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}