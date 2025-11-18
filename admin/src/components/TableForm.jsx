import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

// `initialData` dùng cho việc "Sửa" (sẽ làm sau)
// `onSubmit` là hàm mutation của chúng ta
// `isLoading` là trạng thái của mutation
export default function TableForm({ onSubmit, isLoading, initialData = {} }) {
  const { t } = useTranslation();
  
  // Chỉ cần tên và sức chứa, trạng thái tự động qua socket
const [name, setName] = useState(initialData?.name || '');
const [capacity, setCapacity] = useState(initialData?.capacity || 0);

  //2. "CÁI MÓC" (HOOK) ĐỂ SYNC PROP VÀO STATE
  // Tác dụng: Chạy lại code này BẤT CỨ KHI NÀO `initialData` thay đổi.
  useEffect(() => {
    if (initialData) {
      // Nếu có `initialData` (chế độ Sửa)
      setName(initialData.name || '');
      setCapacity(initialData.capacity || 0);
    } else {
      // Nếu không (chế độ Thêm mới)
      setName('');
      setCapacity(0);
    }
  }, [initialData]); // 👈 "Theo dõi" initialData

  // 2. Hàm xử lý submit
  const handleSubmit = (e) => {
    e.preventDefault();
    // 3. Gọi hàm `onSubmit` với dữ liệu
    // Nếu là chế độ sửa (có initialData), chỉ gửi name và capacity
    // Nếu là chế độ thêm mới, gửi kèm status mặc định
    const data = {
      name,
      capacity: parseInt(capacity, 10),
    };
    
    // Chỉ thêm status khi tạo mới (không có initialData)
    if (!initialData || !initialData.id) {
      data.status = 'AVAILABLE';
    }
    
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* --- TÊN BÀN --- */}
      <div className="space-y-2">
        <Label htmlFor="name">{t('tables_page.table_name')}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      
      {/* --- SỨC CHỨA --- */}
      <div className="space-y-2">
        <Label htmlFor="capacity">{t('tables_page.capacity')}</Label>
        <Input
          id="capacity"
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          required
        />
      </div>
      
      
      
      {/* --- NÚT SUBMIT --- */}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? t('common.saving') : t('common.save')}
      </Button>
    </form>
  );
}