// src/components/MenuForm.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { useToast } from "@/hooks/use-toast";

// Import "linh kiện"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react'; // Icon "Đang tải"

// --- CÁC HÀM GỌI API (Bên trong Form) ---

// 1. Hàm "lấy" (fetch) Danh mục
const fetchCategories = async () => {
  const response = await api.get('/api/categories');
  return response.data;
};

// 2. Hàm "upload" (ghi) Ảnh
//    Nó nhận 1 file, trả về 1 object chứa imageUrl
const uploadImage = async (file) => {
  // Phải dùng FormData để gửi file
  const formData = new FormData();
  formData.append('image', file); // 'image' là key mà API (Multer) mong đợi
  
  const response = await api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data; // Trả về { imageUrl: "http://..." }
};
// ---

export default function MenuForm({ onSubmit, isLoading, initialData = null }) {
  const { toast } = useToast();

  // --- STATE CỦA FORM ---
  const [name, setName] = useState('');
  const [nameJp, setNameJp] = useState('');
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('AVAILABLE');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // 👈 State quan trọng

  // --- LOGIC 1: ĐỒNG BỘ (SYNC) `initialData` (Cho chế độ "Sửa") ---
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setNameJp(initialData.name_jp || '');
      setPrice(initialData.price || 0);
      setDescription(initialData.description || '');
      setStatus(initialData.status || 'AVAILABLE');
      setCategoryId(initialData.categoryId || '');
      setImageUrl(initialData.imageUrl || ''); // 👈 Sync cả ảnh
    } else {
      // Reset form khi ở chế độ "Thêm mới"
      setName('');
      setNameJp('');
      setPrice(0);
      setDescription('');
      setStatus('AVAILABLE');
      setCategoryId('');
      setImageUrl('');
    }
  }, [initialData]);

  // --- LOGIC 2: LẤY DANH SÁCH DANH MỤC (`useQuery` bên trong Form) ---
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // --- LOGIC 3: UPLOAD ẢNH (`useMutation` bên trong Form) ---
  const uploadImageMutation = useMutation({
    mutationFn: uploadImage,
    onSuccess: (data) => {
      // Bước 4c: Khi upload thành công, set URL vào state
      setImageUrl(data.imageUrl);
      toast({ title: "Upload thành công!", description: "Ảnh đã được tải lên." });
    },
    onError: () => {
      toast({
        title: "Upload thất bại!",
        description: "Không thể tải ảnh lên. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  // Bước 4b: Hàm xử lý khi chọn file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Bước 4b: Gọi "công nhân upload"
      uploadImageMutation.mutate(file);
    }
  };

  // --- LOGIC 4: SUBMIT FORM CHÍNH ---
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Gửi dữ liệu (đã có imageUrl) lên "cha"
    onSubmit({
      name,
      name_jp: nameJp,
      price: parseInt(price, 10),
      description,
      status,
      categoryId: parseInt(categoryId, 10),
      imageUrl, // 👈 Gửi URL (state) đi
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      
      {/* --- CỘT UPLOAD ẢNH --- */}
      <div className="space-y-2">
        <Label htmlFor="image">Ảnh món ăn</Label>
        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploadImageMutation.isLoading}
        />
        {/* Hiển thị "Đang tải" hoặc "Ảnh đã tải lên" */}
        {uploadImageMutation.isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Đang tải ảnh lên...</span>
          </div>
        ) : (
          imageUrl && (
            <div className="mt-2">
              <img
                src={imageUrl}
                alt="Xem trước"
                className="w-32 h-32 object-cover rounded-md"
              />
            </div>
          )
        )}
      </div>

      {/* --- CỘT TÊN (VI) --- */}
      <div className="space-y-2">
        <Label htmlFor="name">Tên món (Tiếng Việt)</Label>
        <Input
          id="name" value={name} onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      
      {/* --- CỘT TÊN (JP) --- */}
      <div className="space-y-2">
        <Label htmlFor="nameJp">Tên món (Tiếng Nhật)</Label>
        <Input
          id="nameJp" value={nameJp} onChange={(e) => setNameJp(e.target.value)}
        />
      </div>

      {/* --- CỘT GIÁ --- */}
      <div className="space-y-2">
        <Label htmlFor="price">Giá (VNĐ)</Label>
        <Input
          id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>

      {/* --- CỘT DANH MỤC (`useQuery` data) --- */}
      <div className="space-y-2">
        <Label htmlFor="category">Danh mục</Label>
        <Select
          value={categoryId ? String(categoryId) : ''}
          onValueChange={setCategoryId}
          disabled={isLoadingCategories}
        >
          <SelectTrigger>
            <SelectValue placeholder={isLoadingCategories ? "Đang tải danh mục..." : "Chọn một danh mục"} />
          </SelectTrigger>
          <SelectContent>
            {categories && categories.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* --- CỘT TRẠNG THÁI --- */}
      <div className="space-y-2">
        <Label htmlFor="status">Trạng thái</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AVAILABLE">Có sẵn</SelectItem>
            <SelectItem value="UNAVAILABLE">Hết hàng</SelectItem>
            <SelectItem value="HIDDEN">Ẩn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* --- CỘT MÔ TẢ --- */}
      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả ngắn về món ăn..."
        />
      </div>

      {/* --- NÚT SUBMIT CHÍNH --- */}
      <Button
        type="submit"
        // Vô hiệu hóa nếu (1) Đang submit form HOẶC (2) Đang upload ảnh
        disabled={isLoading || uploadImageMutation.isLoading}
        className="w-full"
      >
        {isLoading ? 'Đang lưu...' : (uploadImageMutation.isLoading ? 'Đang xử lý ảnh...' : 'Lưu món ăn')}
      </Button>
    </form>
  );
}