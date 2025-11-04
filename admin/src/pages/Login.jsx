// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Import component của Shadcn
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  // 1. Lấy hàm `login` từ "Não"
  const login = useAuthStore((state) => state.login);
  const accessToken = useAuthStore((state) => state.accessToken);
  const navigate = useNavigate(); // Hook để chuyển trang
  
  // 2. State cục bộ cho form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Nếu phát hiện CÓ accessToken (đã đăng nhập)
    if (accessToken) {
      // Chuyển hướng ngay lập tức về trang chủ
      navigate('/', { replace: true });
    }
  }, [accessToken, navigate]); // Chạy lại khi token thay đổi

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Xóa lỗi cũ

    // 3. Gọi hàm login từ "Não"
    const result = await login(email, password);

    if (result.success) {
      // 4. Nếu thành công, chuyển hướng về trang chủ
      navigate('/'); // (Trang '/' là Dashboard của chúng ta)
    } else {
      // 5. Nếu thất bại, hiển thị lỗi
      setError(result.error);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-8 space-y-4 border rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Đăng nhập Admin</h2>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" className="w-full">
          Đăng nhập
        </Button>
      </form>
    </div>
  );
}