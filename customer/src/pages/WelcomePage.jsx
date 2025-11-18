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
            Chào mừng quý khách đến với nhà hàng
          </h1>
        </div>

        {/* Hướng dẫn */}
        <div className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Quý khách vui lòng truy cập ứng dụng camera trên điện thoại hoặc Zalo để quét mã QR đặt món ăn.
          </p>

          {/* Hướng dẫn chi tiết */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg mt-0.5">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Sử dụng Camera điện thoại</p>
                <p className="text-xs text-muted-foreground">
                  Mở ứng dụng Camera và quét mã QR trên bàn
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg mt-0.5">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Sử dụng Zalo</p>
                <p className="text-xs text-muted-foreground">
                  Mở Zalo, chọn "Quét mã QR" và quét mã trên bàn
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lưu ý */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 Mã QR được đặt trên mỗi bàn ăn. Vui lòng quét mã để bắt đầu đặt món.
          </p>
        </div>
      </div>
    </div>
  );
}

