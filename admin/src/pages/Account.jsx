import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import ProfileForm from '../components/ProfileForm';
import PasswordForm from '../components/PasswordForm';

const updateProfile = async (data) => {
  const response = await api.patch('/api/auth/me', data);
  return response.data;
};

const changePassword = async (data) => {
  const response = await api.post('/api/auth/change-password', data);
  return response.data;
};

export default function AccountPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const updateUserInStore = useAuthStore((state) => state.updateUser);

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    
    onSuccess: (data) => {
      toast({ title: t('account_page.success_update_title'), description: t('account_page.success_update_desc'), duration: 5000 });
      
      updateUserInStore(data.user); 
      
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (error) => {
      toast({
        title: t('account_page.error_title'),
        description: error.response?.data?.message || t('account_page.error_update_desc'),
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: (data) => {
      toast({ title: t('account_page.success_password_title'), description: data.message, duration: 5000 });
    },
    onError: (error) => {
      toast({
        title: t('account_page.error_password_title'),
        description: error.response?.data?.message || t('account_page.error_password_desc'),
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const handleProfileSubmit = (data) => {
    updateProfileMutation.mutate(data);
  };

  const handlePasswordSubmit = (data) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold text-foreground">{t('account_page.title')}</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('account_page.profile_title')}</CardTitle>
            <CardDescription>
              {t('account_page.profile_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              onSubmit={handleProfileSubmit}
              isLoading={updateProfileMutation.isLoading}
            />
          </CardContent>
        </Card>

       <Card>
          <CardHeader>
            <CardTitle>{t('account_page.password_title')}</CardTitle>
            <CardDescription>
              {t('account_page.password_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm 
              onSubmit={handlePasswordSubmit}
              isLoading={changePasswordMutation.isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
