import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Import component của Shadcn
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  // 1. Lấy hàm `login` từ "Não"
  const login = useAuthStore((state) => state.login);
  const accessToken = useAuthStore((state) => state.accessToken);
  const navigate = useNavigate(); // Hook để chuyển trang

  const { toast } = useToast();
  const { t } = useTranslation();

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
        title: t('login_page.success_title'),
        description: t('login_page.success_desc'),
        duration: 3000
      });
      navigate('/'); // (Trang '/' là Dashboard của chúng ta)
    } else {
      // 5. Nếu thất bại, hiển thị lỗi
      // Map error code sang translation key
      let errorMessage = t('login_page.error_desc'); // Default message
      if (result.errorCode === 'MISSING_CREDENTIALS') {
        errorMessage = t('login_page.error_missing_credentials');
      } else if (result.errorCode === 'EMAIL_NOT_FOUND') {
        errorMessage = t('login_page.error_email_not_found');
      } else if (result.errorCode === 'INVALID_PASSWORD') {
        errorMessage = t('login_page.error_invalid_password');
      }
      
      toast({
        title: t('login_page.error_title'),
        description: errorMessage,
        variant: "destructive"
      });
      // setError(result.error);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-8 space-y-4 border rounded-lg shadow-md bg-card">
        <h2 className="text-2xl font-bold text-center text-card-foreground">{t('login_page.title')}</h2>
        <div>
          <Label htmlFor="email">{t('login_page.email')}</Label>
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
          <Label htmlFor="password">{t('login_page.password')}</Label>
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
          {isLoading ? t('login_page.submitting') : t('login_page.submit')}
        </Button>
      </form>
    </div>
  );
}