import { NavLink } from 'react-router-dom';
import { Home, ClipboardList, Utensils, Users, X, LayoutGrid, Table } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SheetClose } from '@/components/ui/sheet';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';

// NavItem (sử dụng theme colors)
const NavItem = ({ to, icon: Icon, children, onClick }) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={({ isActive }) =>
      cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent',
        isActive && 'bg-secondary text-foreground font-semibold'
      )
    }
    onClick={onClick}
  >
    <Icon className="h-4 w-4" />
    {children}
  </NavLink>
);

// 👇 1. NHẬN PROP MỚI: isMobileSheet = false (mặc định là false)
export default function Sidebar({ onLinkClick, isMobileSheet = false }) {
  // 👇 2. LẤY DỮ LIỆU `user` TỪ "BỘ NÃO"
  //    (Lưu ý: chúng ta chỉ cần `user`, không cần `user.role`
  //     để tránh lỗi nếu user là null)
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();
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
          <NavItem to="/orders" icon={ClipboardList} onClick={onLinkClick}>
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