import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

// Component này "ngốc" y hệt TableForm
// Nó nhận data ban đầu (initialData) và một hàm (onSubmit)
export default function CategoryForm({ onSubmit, isLoading, initialData = null }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [nameJp, setNameJp] = useState('');

  // 1. "Sync" (Đồng bộ) prop `initialData` vào state
  //    (Để "tự điền" form khi ở chế độ "Sửa")
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setNameJp(initialData.name_jp || '');
    } else {
      // Reset form khi ở chế độ "Thêm"
      setName('');
      setNameJp('');
    }
  }, [initialData]);

  // 2. Khi nhấn "Lưu"
  const handleSubmit = (e) => {
    e.preventDefault();
    // 3. Gửi dữ liệu (data) về cho "cha"
    onSubmit({
      name: name,
      name_jp: nameJp,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t('common.name_vi')}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="nameJp">{t('common.name_jp')}</Label>
        <Input
          id="nameJp"
          value={nameJp}
          onChange={(e) => setNameJp(e.target.value)}
        />
      </div>
      
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? t('common.saving') : t('common.save')}
      </Button>
    </form>
  );
}