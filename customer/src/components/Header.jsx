import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom'; 
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { LogOut, Menu, BookOpen, ClipboardList, ShoppingCart } from 'lucide-react'; 
import { useCartStore } from '../store/cartStore';
import { ModeToggle } from "./ModeToggle";
import { LanguageToggle } from "./LanguageToggle";
import api from '../services/api';

export default function CustomerHeader() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const location = useLocation(); 
  const pathname = location.pathname; // Ví dụ: "/order", "/order/cart"
  const { t } = useTranslation();
  
  // Lấy `totalItems` từ "bộ não" Giỏ hàng (dùng selector tối ưu)
  const totalItems = useCartStore((state) => state.getTotalItems());
  const clearCart = useCartStore((state) => state.clearCart);

  const handleLogout = async () => {
    const tableId = localStorage.getItem('table_id');
    const customerName = localStorage.getItem('customer_name');

    // Gọi API để hủy tất cả đơn hàng chưa thanh toán
    try {
      if (tableId && customerName) {
        await api.delete('/api/orders/clear-session', {
          data: { table_id: tableId, customer_name: customerName }
        });
      }
    } catch (error) {
      console.error('Lỗi khi hủy phiên:', error);
    }

    // Xóa localStorage và reload
    localStorage.removeItem('customer_name');
    localStorage.removeItem('table_id');
    localStorage.removeItem('table_name');
    localStorage.removeItem('cart-storage');
    clearCart();
    window.location.reload();
  };

  const handleLinkClick = () => {
    setIsSheetOpen(false);
  };

  const NavLink = ({ to, icon: Icon, children }) => (
    <Link to={to} onClick={handleLinkClick}>
      <Button
        variant={pathname === to ? 'secondary' : 'ghost'} 
        className="w-full justify-start text-lg md:text-sm md:justify-center md:w-auto"
      >
        <Icon className="h-5 w-5 md:mr-2" />
        <span className="md:hidden lg:inline-block">{children}</span>
        {/* Chỉ hiện Badge (số lượng) cho Giỏ hàng */}
        {to === '/order/cart' && totalItems > 0 && (
          <Badge className="ml-2 md:hidden lg:inline-block">{totalItems}</Badge>
        )}
      </Button>
    </Link>
  );

  return (
    <header className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background z-10">
      
      <div className="flex items-center gap-4">
        <div className="md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] bg-background">
              <SheetHeader>
                <SheetTitle className="text-2xl text-left">{t('header.restaurant_name')}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-8">
                <SheetClose asChild>
                  <NavLink to="/order" icon={BookOpen}>{t('header.menu')}</NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink to="/order/cart" icon={ShoppingCart}>{t('header.cart')}</NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink to="/order/status" icon={ClipboardList}>{t('header.orders')}</NavLink>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <h1 className="text-xl font-bold mr-4">{t('header.restaurant_name')}</h1>
          <NavLink to="/order" icon={BookOpen}>{t('header.menu')}</NavLink>
          <NavLink to="/order/cart" icon={ShoppingCart}>{t('header.cart')}</NavLink>
          <NavLink to="/order/status" icon={ClipboardList}>{t('header.orders')}</NavLink>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <LanguageToggle />
        <ModeToggle />
        <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="ghost" 
            className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
          >
            {t('header.logout')}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('header.logout_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('header.logout_confirm_desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('header.logout_cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogout}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t('header.logout_confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>

    </header>
  );
}