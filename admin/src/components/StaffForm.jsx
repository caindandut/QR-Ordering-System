import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { useToast } from "@/hooks/use-toast";
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
      toast({ title: "Upload ảnh đại diện thành công!" });
    },
    onError: () => {
      toast({
        title: "Upload thất bại!",
        description: "Không thể tải ảnh lên. Vui lòng thử lại.",
        variant: "destructive",
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
        <Label htmlFor="avatar">Ảnh đại diện</Label>
        <Input
          id="avatar" type="file" accept="image/*"
          onChange={handleFileChange}
          disabled={uploadImageMutation.isLoading}
        />
        {uploadImageMutation.isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
             <Loader2 className="h-4 w-4 animate-spin" />
             <span>Đang tải ảnh...</span>
          </div>
        ) : (
          avatarUrl && (
            <Avatar className="h-20 w-20 mt-2">
              <AvatarImage src={avatarUrl} alt="Ảnh đại diện" />
              <AvatarFallback>{name[0]}</AvatarFallback>
            </Avatar>
          )
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Họ và Tên</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input 
          id="password" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          placeholder={isEditMode ? "Để trống nếu không đổi" : "Nhập mật khẩu..."}
          required={!isEditMode} // 👈 Chỉ bắt buộc khi Thêm Mới
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Số điện thoại</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Vai trò</Label>
        <Select value={role} onValueChange={setRole} required>
          <SelectTrigger>
            <SelectValue placeholder="Chọn vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="STAFF">Nhân viên</SelectItem>
            <SelectItem value="ADMIN">Quản trị viên</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isLoading || uploadImageMutation.isLoading} className="w-full">
        {isLoading ? 'Đang lưu...' : (uploadImageMutation.isLoading ? 'Đang xử lý ảnh...' : 'Lưu Nhân viên')}
      </Button>
    </form>
  );
}