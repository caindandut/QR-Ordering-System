import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PasswordForm({ onSubmit, isLoading }) {
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
      setError('Mật khẩu mới và xác nhận không khớp.');
      return; // Dừng lại
    }
    
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    onSubmit({ oldPassword, newPassword });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="oldPassword">Mật khẩu cũ</Label>
        <Input
          id="oldPassword" type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">Mật khẩu mới</Label>
        <Input
          id="newPassword" type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
        <Input
          id="confirmPassword" type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      
      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Đang lưu...' : 'Đổi mật khẩu'}
      </Button>
    </form>
  );
}