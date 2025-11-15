import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PasswordForm({ onSubmit, isLoading }) {
  const { t } = useTranslation();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(''); // Xóa lỗi cũ

    // 1. 🧠 KHÁI NIỆM: Client-Side Validation
    //    (Kiểm tra phía Client)
    //    Tại sao? Để tiết kiệm 1 "chuyến" gọi API.
    //    Không có lý do gì gửi 2 mật khẩu không khớp lên server.
    if (newPassword !== confirmPassword) {
      setError(t('account_page.password_mismatch'));
      return; // Dừng lại
    }
    
    if (newPassword.length < 6) {
      setError(t('account_page.password_min_length'));
      return;
    }

    onSubmit({ oldPassword, newPassword });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="oldPassword">{t('account_page.old_password')}</Label>
        <Input
          id="oldPassword" type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">{t('account_page.new_password')}</Label>
        <Input
          id="newPassword" type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('account_page.confirm_password')}</Label>
        <Input
          id="confirmPassword" type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      
      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? t('common.saving') : t('account_page.change_password')}
      </Button>
    </form>
  );
}