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
import { Badge } from '@/components/ui/badge';
import { LogOut, Menu, BookOpen, ClipboardList, ShoppingCart } from 'lucide-react'; // 👈 Thêm icon Giỏ hàng
import { useCartStore } from '../store/cartStore';

export default function CustomerHeader() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const location = useLocation(); 
  const pathname = location.pathname; // Ví dụ: "/order", "/order/cart"
  
  // Lấy `totalItems` từ "bộ não" Giỏ hàng (dùng selector tối ưu)
  const totalItems = useCartStore((state) => state.getTotalItems());

  const handleLogout = () => {
    localStorage.removeItem('customer_name');
    localStorage.removeItem('table_id');
    localStorage.removeItem('table_name');
    localStorage.removeItem('cart-storage');
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
    <header className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
      
      <div className="flex items-center gap-4">
        <div className="md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px]">
              <SheetHeader>
                <SheetTitle className="text-2xl text-left">Nhà hàng</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-8">
                <SheetClose asChild>
                  <NavLink to="/order" icon={BookOpen}>Menu</NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink to="/order/cart" icon={ShoppingCart}>Giỏ hàng</NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink to="/order/status" icon={ClipboardList}>Đơn hàng</NavLink>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <h1 className="text-xl font-bold mr-4">Nhà hàng</h1>
          <NavLink to="/order" icon={BookOpen}>Thực đơn</NavLink>
          <NavLink to="/order/cart" icon={ShoppingCart}>Giỏ hàng</NavLink>
          <NavLink to="/order/status" icon={ClipboardList}>Đơn hàng</NavLink>
        </div>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="ghost" 
            className="text-red-500 hover:text-red-600"
          >
            Đăng xuất
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn đăng xuất?</AlertDialogTitle>
            <AlertDialogDescription>
              Nếu bạn đăng xuất, toàn bộ giỏ hàng và dữ liệu của bạn sẽ bị mất.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogout}
              className="bg-destructive hover:bg-destructive/90"
            >
              Vẫn Đăng xuất
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </header>
  );
}