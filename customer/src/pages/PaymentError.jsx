import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PaymentErrorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">
            {t('payment.error.title')}
          </CardTitle>
          <CardDescription className="mt-2">
            {t('payment.error.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="pt-4 space-y-2">
            <Button 
              onClick={() => navigate('/order/status')} 
              className="w-full"
              size="lg"
            >
              {t('payment.view_orders')}
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
