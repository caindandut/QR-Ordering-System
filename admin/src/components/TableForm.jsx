import { useState, useEffect } from 'react';
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
import { useTranslation } from 'react-i18next';

// `initialData` dùng cho việc "Sửa" (sẽ làm sau)
// `onSubmit` là hàm mutation của chúng ta
// `isLoading` là trạng thái của mutation
export default function TableForm({ onSubmit, isLoading, initialData = {} }) {
  const { t } = useTranslation();
  
  // Dùng `?.` (Optional Chaining)
// Nó có nghĩa là: "Hãy thử đọc 'name'. Nếu 'initialData' là null,
// đừng báo lỗi, cứ coi như kết quả là 'undefined'."
const [name, setName] = useState(initialData?.name || '');
const [capacity, setCapacity] = useState(initialData?.capacity || 0);
const [status, setStatus] = useState(initialData?.status || 'AVAILABLE');

  //2. "CÁI MÓC" (HOOK) ĐỂ SYNC PROP VÀO STATE
  // Tác dụng: Chạy lại code này BẤT CỨ KHI NÀO `initialData` thay đổi.
  useEffect(() => {
    if (initialData) {
      // Nếu có `initialData` (chế độ Sửa)
      setName(initialData.name || '');
      setCapacity(initialData.capacity || 0);
      setStatus(initialData.status || 'AVAILABLE');
    } else {
      // Nếu không (chế độ Thêm mới)
      setName('');
      setCapacity(0);
      setStatus('AVAILABLE');
    }
  }, [initialData]); // 👈 "Theo dõi" initialData

  // 2. Hàm xử lý submit
  const handleSubmit = (e) => {
    e.preventDefault();
    // 3. Gọi hàm `onSubmit` (là hàm `mutate` từ `useMutation`)
    //    với dữ liệu đã được chuẩn hóa.
    onSubmit({
      name,
      capacity: parseInt(capacity, 10),
      status,
    });
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
      
      {/* --- TRẠNG THÁI --- */}
      <div className="space-y-2">
        <Label htmlFor="status">{t('common.status')}</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder={t('tables_page.select_status')} />
          </SelectTrigger>
          <SelectContent>
            {/* Đây là các "Key" mà chúng ta đã thống nhất */}
            <SelectItem value="AVAILABLE">{t('tables_page.status_available')}</SelectItem>
            <SelectItem value="OCCUPIED">{t('tables_page.status_occupied')}</SelectItem>
            <SelectItem value="HIDDEN">{t('tables_page.status_hidden')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* --- NÚT SUBMIT --- */}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? t('common.saving') : t('common.save')}
      </Button>
    </form>
  );
}