import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotification } from '../context/NotificationContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User, LogOut, Menu, Bell } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import Sidebar from './Sidebar';
import { ModeToggle } from "./ModeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

export default function Header() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { newOrders, unreadCount, removeNotification, paymentRequests, paymentRequestCount, removePaymentRequest } = useNotification();
  const fallbackValue = t('orders_page.na', { defaultValue: 'N/A' });

  const handleLogout = async () => {
    try {
      // 4. Chờ cho "bộ não" gọi API và xóa state
      await logout();
      
      // 5. Hiển thị thông báo thành công
      toast({
        title: t('header.logout_success_title'),
        description: t('header.logout_success_desc'),
      });

    } catch (error) {
      // (Phòng trường hợp logout bị lỗi, hiếm khi xảy ra)
      console.error("Logout error:", error);
      toast({
        title: t('header.logout_error_title'),
        description: t('header.logout_error_desc'),
        variant: "destructive",
      });
    }
    
    // 6. Chuyển hướng về trang login
    // (Luôn chuyển hướng dù thành công hay thất bại)
    navigate('/login');
  };

  const getInitials = (name) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'AD';
  };

  return (
    <header className="flex h-16 items-center border-b border-border bg-background px-4 md:px-6 gap-4">
      {/* Nút Hamburger (Chỉ hiện trên Mobile) */}
      <div className="md:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          
          <SheetContent side="left" className="p-0 w-64 bg-background">
            <Sidebar onLinkClick={() => setIsSheetOpen(false)} isMobileSheet={true} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Spacer - Đẩy toggle và avatar sang phải (cả mobile và desktop) */}
      <div className="flex-grow"></div>
      
      {/* Toggle theme, language, notification bell và Avatar */}
      <div className="flex items-center gap-2">
        <LanguageToggle />
        <ModeToggle />
        
        {/* Notification Bell Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {(unreadCount + paymentRequestCount) > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {(unreadCount + paymentRequestCount) > 99 ? '99+' : (unreadCount + paymentRequestCount)}
                </Badge>
              )}
              <span className="sr-only">{t('header.notifications.button_label')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto" align="end">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>{t('header.notifications.title')}</span>
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount}</Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {newOrders.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {t('header.notifications.empty')}
              </div>
            ) : (
              newOrders.map((order) => (
                <DropdownMenuItem 
                  key={order.id}
                  className="flex flex-col items-start p-3 cursor-pointer"
                  onClick={() => {
                    navigate('/orders');
                    removeNotification(order.id);
                  }}
                >
                  <div className="flex items-start justify-between w-full mb-1">
                    <span className="font-semibold text-sm">
                      {t('header.notifications.new_order', { id: order.id })}
                    </span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {t('header.notifications.new_badge')}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>
                      <span className="font-medium">{t('header.notifications.table')}</span> {order.table?.name || fallbackValue}
                    </div>
                    <div>
                      <span className="font-medium">{t('header.notifications.customer')}</span> {order.customerName || fallbackValue}
                    </div>
                    <div>
                      <span className="font-medium">{t('header.notifications.time')}</span>{' '}
                      {order.createdAt ? format(new Date(order.createdAt), 'HH:mm dd/MM/yyyy') : fallbackValue}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            )}
            
            {/* Yêu cầu thanh toán */}
            {paymentRequests.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span className="text-orange-600 dark:text-orange-400">
                    {t('header.notifications.payment_section')}
                  </span>
                  {paymentRequestCount > 0 && (
                    <Badge variant="destructive">{paymentRequestCount}</Badge>
                  )}
                </DropdownMenuLabel>
                {paymentRequests.map((request) => (
                  <DropdownMenuItem 
                    key={request.orderId}
                    className="flex flex-col items-start p-3 cursor-pointer"
                    onClick={() => {
                      navigate(`/orders?highlightOrder=${request.orderId}`);
                      removePaymentRequest(request.orderId);
                    }}
                  >
                    <div className="flex items-start justify-between w-full mb-1">
                      <span className="font-semibold text-sm">
                        {t('header.notifications.payment_title', { id: request.orderId })}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div>
                        <span className="font-medium">{t('header.notifications.table')}</span> {request.tableName || fallbackValue}
                      </div>
                      <div>
                        <span className="font-medium">{t('header.notifications.customer')}</span> {request.customerName || fallbackValue}
                      </div>
                      <div>
                        <span className="font-medium">{t('header.notifications.total')}</span>{' '}
                        <span className="font-bold text-primary">{request.totalAmount?.toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}
            
            {(newOrders.length > 0 || paymentRequests.length > 0) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link 
                    to="/orders" 
                    className="w-full text-center justify-center font-medium text-primary"
                  >
                    {t('header.notifications.view_all')}
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Dropdown Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>
              <p>{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/account" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>{t('header.account')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 dark:text-red-400 focus:text-red-600 dark:focus:text-red-300">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('header.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}