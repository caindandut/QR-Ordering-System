import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '@/components/LanguageToggle';

export default function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const accessToken = useAuthStore((state) => state.accessToken);
  const navigate = useNavigate();

  const { toast } = useToast();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (accessToken) {
      navigate('/', { replace: true });
    }
  }, [accessToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: t('login_page.success_title'),
        description: t('login_page.success_desc'),
        duration: 5000
      });
      navigate('/');
    } else {
      let errorMessage = t('login_page.error_desc');
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
        variant: "destructive",
        duration: 5000
      });
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-background relative">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      
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
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t('login_page.submitting') : t('login_page.submit')}
        </Button>
      </form>
    </div>
  );
}
