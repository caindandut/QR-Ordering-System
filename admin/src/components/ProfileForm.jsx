import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from '../store/authStore'; 
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};


// Form này nhận 2 props:
// 1. `onSubmit`: "Công nhân Sửa" (updateProfileMutation)
// 2. `isLoading`: Trạng thái của "Công nhân" đó
export default function ProfileForm({ onSubmit, isLoading }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const user = useAuthStore((state) => state.user);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // 2. "Sync" (Đồng bộ) Dữ liệu từ "Bộ não" vào Form
  //    (Chỉ chạy 1 lần khi component tải)
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]); // Theo dõi `user` từ "bộ não"

  // 3. Logic Upload Ảnh (Tái sử dụng)
  const uploadImageMutation = useMutation({
    mutationFn: uploadImage,
    onSuccess: (data) => {
      setAvatarUrl(data.imageUrl); // Cập nhật state của Form
      toast({ title: t('account_page.upload_success'), duration: 5000 });
    },
    onError: () => {
        toast({ title: t('account_page.upload_error'), variant: "destructive", duration: 5000 });
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadImageMutation.mutate(file);
    }
  };

  // 4. Submit Form Chính
  const handleSubmit = (e) => {
    e.preventDefault();
    // Gửi dữ liệu (đã lọc) về cho "cha"
    onSubmit({
      name,
      phone,
      avatarUrl
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 1. Logic Upload Ảnh (Y HỆT StaffForm) */}
      <div className="space-y-2">
        <Label htmlFor="avatar">{t('account_page.avatar')}</Label>
        <Input
          id="avatar" type="file" accept="image/*"
          onChange={handleFileChange}
          disabled={uploadImageMutation.isLoading}
        />
        {uploadImageMutation.isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          avatarUrl && (
            <Avatar className="h-20 w-20 mt-2">
              <AvatarImage src={avatarUrl} alt={t('account_page.avatar')} />
              <AvatarFallback>{name[0]}</AvatarFallback>
            </Avatar>
          )
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t('account_page.email')}</Label>
        <Input
          id="email"
          type="email"
          value={user?.email || ''}
          disabled
        />
      </div>
      
      {/* 3. Tên Nhân viên */}
      <div className="space-y-2">
        <Label htmlFor="name">{t('account_page.display_name')}</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">{t('account_page.phone')}</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <Button type="submit" disabled={isLoading || uploadImageMutation.isLoading} className="w-full">
        {isLoading ? t('common.saving') : (uploadImageMutation.isLoading ? t('account_page.processing_image') : t('account_page.save_changes'))}
      </Button>
    </form>
  );
}