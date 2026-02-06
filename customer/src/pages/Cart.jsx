import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore'; 
import { useMutation } from '@tanstack/react-query';
import api from '../services/api.js';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';


const placeOrder = async (orderData) => {
  const response = await api.post('/api/orders', orderData);
  return response.data;
};

export default function CartPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const { toast } = useToast();

  const items = useCartStore((state) => state.items);
  const incrementItem = useCartStore((state) => state.incrementItem);
  const decrementItem = useCartStore((state) => state.decrementItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const totalPrice = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  );
  
  const placeOrderMutation = useMutation({
    mutationFn: placeOrder,
    
    onSuccess: () => {
      toast({
        title: t('cart_page.order_success_title'),
        description: t('cart_page.order_success_desc'),
        duration: 5000,
      });
      
      clearCart();
      
      navigate(`/order/status/`); 
    },
    onError: (error) => {
      toast({
        title: t('cart_page.order_failed_title'),
        description: error.message || t('cart_page.order_failed_desc'),
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const handlePlaceOrder = () => {
    const table_id = sessionStorage.getItem('table_id');
    const customer_name = sessionStorage.getItem('customer_name');
    
    const formattedItems = items.map(item => ({
      item_id: item.id,
      quantity: item.quantity,
    }));
    
    placeOrderMutation.mutate({
      table_id,
      customer_name,
      items: formattedItems,
    });
  };

  if (items.length === 0) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold text-foreground">{t('cart_page.empty_message')}</h1>
        <Button onClick={() => navigate('/order')} className="mt-4">
          {t('cart_page.back_to_menu')}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-background">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-4xl font-bold text-foreground">{t('cart_page.title')}</h3>
        
        <Button asChild variant="outline">
          <Link to="/order">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('cart_page.add_more_items')}
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('cart_page.order_details')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src={item.imageUrl} 
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div>
                  <h3 className="font-semibold text-card-foreground">
                    {lang === 'jp' ? item.name_jp : item.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.price.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => decrementItem(item.id)}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-bold w-4 text-center text-card-foreground">{item.quantity}</span>
                <Button variant="outline" size="icon" onClick={() => incrementItem(item.id)}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => removeItem(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex flex-col items-end gap-4">
          <div className="text-2xl font-bold text-card-foreground">
            {t('cart_page.total')} {totalPrice.toLocaleString('vi-VN')}đ
          </div>
          <Button 
            size="lg" 
            onClick={handlePlaceOrder}
            disabled={placeOrderMutation.isLoading}
          >
            {placeOrderMutation.isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {placeOrderMutation.isLoading ? t('cart_page.placing_order') : t('cart_page.place_order')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
