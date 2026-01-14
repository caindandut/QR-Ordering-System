import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PaymentFailedPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const code = searchParams.get('code');

  useEffect(() => {
    // Nếu không có orderId, redirect về trang chủ
    if (!orderId) {
      navigate('/order/status');
    }
  }, [orderId, navigate]);

  const getErrorMessage = (code) => {
    const errorMessages = {
      '07': t('payment.errors.code_07'),
      '09': t('payment.errors.code_09'),
      '10': t('payment.errors.code_10'),
      '11': t('payment.errors.code_11'),
      '12': t('payment.errors.code_12'),
      '13': t('payment.errors.code_13'),
      '51': t('payment.errors.code_51'),
      '65': t('payment.errors.code_65'),
      '75': t('payment.errors.code_75'),
      '79': t('payment.errors.code_79'),
      '99': t('payment.errors.code_99'),
    };
    return errorMessages[code] || t('payment.errors.unknown');
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl text-red-600 dark:text-red-400">
            {t('payment.failed.title')}
          </CardTitle>
          <CardDescription className="mt-2">
            {t('payment.failed.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {code && (
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {t('payment.error_code')}: {code}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {getErrorMessage(code)}
                </p>
              </div>
            </div>
          )}
          <div className="pt-4 space-y-2">
            <Button 
              onClick={() => navigate('/order/status')} 
              className="w-full"
              size="lg"
            >
              {t('payment.try_again')}
            </Button>
            <Button 
              onClick={() => navigate('/order')} 
              variant="outline"
              className="w-full"
            >
              {t('payment.back_to_menu')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





