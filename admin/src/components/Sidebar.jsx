import { NavLink } from 'react-router-dom';
import { Home, ClipboardList, Utensils, Users, X, LayoutGrid, Table } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SheetClose } from '@/components/ui/sheet';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useNotificationSound } from '../hooks/useNotificationSound';
import { useToast } from '@/hooks/use-toast';

const NavItem = ({ to, icon, children, onClick, badge }) => {
  const Icon = icon;
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent relative',
          isActive && 'bg-secondary text-foreground font-semibold'
        )
      }
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      {children}
      {badge > 0 && (
        <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center font-semibold">
          {badge}
        </span>
      )}
    </NavLink>
  );
};

export default function Sidebar({ onLinkClick, isMobileSheet = false }) {
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();
  const [pendingCount, setPendingCount] = useState(0);
  const { play } = useNotificationSound();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await api.get('/api/admin/orders/pending-count');
        setPendingCount(response.data.count);
      } catch {
      }
    };

    fetchPendingCount();

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');

    socket.on('new_order_received', (order) => {
      if (order.status === 'PENDING') {
        setPendingCount(prev => prev + 1);
        
        play(); 
        toast({
          title: "Đơn hàng mới! 🔔",
          description: `${order.table?.name} - ${order.customerName}`,
          variant: "default",
          duration: 5000,
        });
      }
    });

    socket.on('payment_requested', (data) => {
      play();
      toast({
        title: "Yêu cầu thanh toán! 💸",
        description: `${data.tableName} - ${data.customerName}`,
        variant: "warning",
        duration: 5000,
      });
    });

    socket.on('order_updated_for_admin', (order) => {
      if (!order) return;

      const status = order.paymentStatus || order.status;
      if (status === 'PAID' || status === 'Paid' || status?.toUpperCase() === 'PAID') {
        const tableName = order.table?.name || order.tableName || 'Bàn ?';
        const customerName = order.customerName || 'Khách';
        const totalAmount = order.totalAmount ? Number(order.totalAmount).toLocaleString('vi-VN') : '0';
        
        play();
        toast({
          title: t('header.notifications.vnpay_success_toast', { defaultValue: 'Khách đã thanh toán VNPay ✅' }),
          description: `${tableName} - ${customerName} - ${totalAmount}đ`,
          variant: "success",
          duration: 5000,
        });
      }
    });

    socket.on('orderStatusChanged', () => {
      fetchPendingCount();
    });

    return () => {
      socket.disconnect();
    };
  }, [play, toast]);
  return (
    <div className="h-full border-r border-border dark:border-white/10 bg-card w-64">
      <div className="flex h-full max-h-screen flex-col gap-2">
        
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <h1 className="text-lg font-bold text-card-foreground">{t('sidebar.restaurant_name')}</h1>
          
          {isMobileSheet && (
            <SheetClose asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-6 w-6" />
                <span className="sr-only">{t('sidebar.close_menu')}</span>
              </button>
            </SheetClose>
          )}
        </div>
        
        <nav className="flex-1 flex flex-col gap-1 px-4 text-sm font-medium">
          <NavItem to="/" icon={Home} onClick={onLinkClick}>
            {t('sidebar.dashboard')}
          </NavItem>
          <NavItem to="/orders" icon={ClipboardList} onClick={onLinkClick} badge={pendingCount}>
            {t('sidebar.orders')}
          </NavItem>
          <NavItem to="/tables" icon={Table} onClick={onLinkClick}>
            {t('sidebar.tables')}
          </NavItem>
          <NavItem to="/menu" icon={Utensils} onClick={onLinkClick}>
            {t('sidebar.menu')}
          </NavItem>
          <NavItem to="/categories" icon={LayoutGrid} onClick={onLinkClick}>
            {t('sidebar.categories')}
          </NavItem>
          {user?.role === 'ADMIN' && (
            <NavItem to="/staff" icon={Users} onClick={onLinkClick}>
              {t('sidebar.staff')}
            </NavItem>
          )}
        </nav>
      </div>
    </div>
  );
}
