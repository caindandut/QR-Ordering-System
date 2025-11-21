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

// NavItem (sử dụng theme colors)
const NavItem = ({ to, icon: Icon, children, onClick, badge }) => (
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

export default function Sidebar({ onLinkClick, isMobileSheet = false }) {
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();
  const [pendingCount, setPendingCount] = useState(0);
  const { play } = useNotificationSound();

  // Fetch pending orders count
  const fetchPendingCount = async () => {
    try {
      const response = await api.get('/api/admin/orders/pending-count');
      setPendingCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch pending count:', error);
    }
  };

  useEffect(() => {
    fetchPendingCount();

    // Socket.IO listener for new orders
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');

    socket.on('new_order_received', (order) => {
      if (order.status === 'PENDING') {
        setPendingCount(prev => prev + 1);
        play(); // Play notification sound
        
        // Show toast notification (if toast is available)
        console.log('🔔 Đơn hàng mới:', order);
      }
    });

    socket.on('orderStatusChanged', (data) => {
      // Refetch count when order status changes
      fetchPendingCount();
    });

    return () => {
      socket.disconnect();
    };
  }, []);
  return (
    <div className="h-full border-r border-border bg-card w-64">
      <div className="flex h-full max-h-screen flex-col gap-2">
        
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <h1 className="text-lg font-bold text-card-foreground">{t('sidebar.restaurant_name')}</h1>
          
          {/* 👇 2. CHỈ RENDER NÚT "X" KHI isMobileSheet LÀ TRUE */}
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
          {/* ... (các NavItem vẫn giữ nguyên) ... */}
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