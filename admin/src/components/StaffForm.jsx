import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react'; 

const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file); 
  
  const response = await api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data; 
};


export default function StaffForm({ onSubmit, isLoading, initialData = null }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const isEditMode = Boolean(initialData);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('STAFF');
  const [avatarUrl, setAvatarUrl] = useState('');

  // 3. "Sync" (Đồng bộ) `initialData` (Tái sử dụng)
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setEmail(initialData.email || '');
      setPhone(initialData.phone || '');
      setRole(initialData.role || 'STAFF');
      setAvatarUrl(initialData.avatarUrl || '');
      setPassword(''); // Luôn reset ô pass khi mở
    } else {
      // Reset form
      setName(''); setEmail(''); setPassword(''); setPhone(''); setRole('STAFF'); setAvatarUrl('');
    }
  }, [initialData]);

  const uploadImageMutation = useMutation({
    mutationFn: uploadImage,
    onSuccess: (data) => {
      setAvatarUrl(data.imageUrl);
      toast({ title: t('staff_page.upload_success'), duration: 5000 });
    },
    onError: () => {
      toast({
        title: t('staff_page.upload_error_title'),
        description: t('staff_page.upload_error_desc'),
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadImageMutation.mutate(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 6. LOGIC MẬT KHẨU CÓ ĐIỀU KIỆN (Khái niệm mới)
    const dataToSend = {
      name,
      email,
      phone,
      role,
      avatarUrl,
    };
    
    // Chỉ gửi `password` đi NẾU:
    // 1. Đang ở chế độ Thêm MỚI (luôn gửi).
    // 2. Đang ở chế độ Sửa VÀ người dùng ĐÃ NHẬP gì đó vào ô pass.
    if (!isEditMode || (isEditMode && password)) {
      dataToSend.password = password;
    }
    
    // Gửi dữ liệu đã "lọc" về cho "cha"
    onSubmit(dataToSend);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      
      <div className="space-y-2">
        <Label htmlFor="avatar">{t('staff_page.avatar')}</Label>
        <Input
          id="avatar" type="file" accept="image/*"
          onChange={handleFileChange}
          disabled={uploadImageMutation.isLoading}
        />
        {uploadImageMutation.isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
             <Loader2 className="h-4 w-4 animate-spin" />
             <span>{t('staff_page.uploading')}</span>
          </div>
        ) : (
          avatarUrl && (
            <Avatar className="h-20 w-20 mt-2">
              <AvatarImage src={avatarUrl} alt={t('staff_page.avatar')} />
              <AvatarFallback>{name[0]}</AvatarFallback>
            </Avatar>
          )
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{t('staff_page.full_name')}</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">{t('staff_page.email')}</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">{t('staff_page.password')}</Label>
        <Input 
          id="password" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder={isEditMode ? t('staff_page.password_placeholder_edit') : t('staff_page.password_placeholder')}
          required={!isEditMode} // 👈 Chỉ bắt buộc khi Thêm Mới
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">{t('staff_page.phone')}</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">{t('staff_page.role')}</Label>
        <Select value={role} onValueChange={setRole} required>
          <SelectTrigger>
            <SelectValue placeholder={t('staff_page.select_role')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="STAFF">{t('staff_page.role_staff')}</SelectItem>
            <SelectItem value="ADMIN">{t('staff_page.role_admin')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isLoading || uploadImageMutation.isLoading} className="w-full">
        {isLoading ? t('common.saving') : (uploadImageMutation.isLoading ? t('staff_page.processing_image') : t('staff_page.save_staff'))}
      </Button>
    </form>
  );
}