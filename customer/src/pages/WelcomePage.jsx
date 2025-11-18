import { Camera, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ModeToggle } from '@/components/ModeToggle';

export default function WelcomePage() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4 relative">
      {/* Nút toggle ngôn ngữ và dark mode ở góc trên bên phải */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageToggle />
        <ModeToggle />
      </div>

      <div className="w-full max-w-md p-8 bg-card shadow-lg rounded-lg border border-border text-center space-y-6">
        {/* Tiêu đề chào mừng */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-card-foreground">
            {t('welcome_page.title')}
          </h1>
        </div>

        {/* Hướng dẫn */}
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            {t('welcome_page.description')}
          </p>

          {/* Hướng dẫn chi tiết */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg mt-0.5">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{t('welcome_page.camera.title')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('welcome_page.camera.desc')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg mt-0.5">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{t('welcome_page.zalo.title')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('welcome_page.zalo.desc')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lưu ý */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {t('welcome_page.note')}
          </p>
        </div>
      </div>
    </div>
  );
}

