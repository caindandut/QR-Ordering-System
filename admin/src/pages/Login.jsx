import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Import component của Shadcn
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  // 1. Lấy hàm `login` từ "Não"
  const login = useAuthStore((state) => state.login);
  const accessToken = useAuthStore((state) => state.accessToken);
  const navigate = useNavigate(); // Hook để chuyển trang

  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  
  // 2. State cục bộ cho form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [error, setError] = useState('');

  useEffect(() => {
    // Nếu phát hiện CÓ accessToken (đã đăng nhập)
    if (accessToken) {
      // Chuyển hướng ngay lập tức về trang chủ
      navigate('/', { replace: true });
    }
  }, [accessToken, navigate]); // Chạy lại khi token thay đổi

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Bắt đầu loading
    // setError(''); // Xóa lỗi cũ

    // 3. Gọi hàm login từ "Não"
    const result = await login(email, password);
    setIsLoading(false); // Kết thúc loading

    if (result.success) {
      // 4. Nếu thành công, chuyển hướng về trang chủ
      toast({
        title: "Đăng nhập thành công!",
        description: "Chào mừng bạn đã trở lại.",
        // variant: "success"
        duration: 3000
      });
      navigate('/'); // (Trang '/' là Dashboard của chúng ta)
    } else {
      // 5. Nếu thất bại, hiển thị lỗi
      toast({
        title: "Đăng nhập thất bại",
        description: result.error || "Vui lòng kiểm tra lại thông tin đăng nhập.",
        variant: "destructive"
      });
      // setError(result.error);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-8 space-y-4 border rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Đăng nhập</h2>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </div>
        
        {/* {error && <p className="text-red-500 text-sm">{error}</p>} */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>
    </div>
  );
}