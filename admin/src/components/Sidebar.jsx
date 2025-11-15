import { NavLink } from 'react-router-dom';
import { Home, ClipboardList, Utensils, Users, X, LayoutGrid, Table } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SheetClose } from '@/components/ui/sheet';
import { useAuthStore } from '../store/authStore';

// NavItem (không đổi)
const NavItem = ({ to, icon: Icon, children, onClick }) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={({ isActive }) =>
      cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-gray-400 transition-all hover:text-white hover:bg-gray-700',
        isActive && 'bg-gray-800 text-white'
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
  return (
    <div className="h-full border-r bg-gray-900 w-64 text-white">
      <div className="flex h-full max-h-screen flex-col gap-2">
        
        <div className="flex h-16 items-center justify-between border-b border-gray-700 px-6">
          <h1 className="text-lg font-bold">Nhà hàng</h1>
          
          {/* 👇 2. CHỈ RENDER NÚT "X" KHI isMobileSheet LÀ TRUE */}
          {isMobileSheet && (
            <SheetClose asChild>
              <button className="text-gray-400 hover:text-white transition-colors">
                <X className="h-6 w-6" />
                <span className="sr-only">Đóng menu</span>
              </button>
            </SheetClose>
          )}
        </div>
        
        <nav className="flex-1 flex flex-col gap-1 px-4 text-sm font-medium">
          {/* ... (các NavItem vẫn giữ nguyên) ... */}
          <NavItem to="/" icon={Home} onClick={onLinkClick}>
            Dashboard
          </NavItem>
          <NavItem to="/orders" icon={ClipboardList} onClick={onLinkClick}>
            Quản lý Đơn hàng
          </NavItem>
          <NavItem to="/tables" icon={Table} onClick={onLinkClick}>
            Quản lý Bàn ăn
          </NavItem>
          <NavItem to="/menu" icon={Utensils} onClick={onLinkClick}>
            Quản lý Món ăn
          </NavItem>
          <NavItem to="/categories" icon={LayoutGrid} onClick={onLinkClick}>
            Quản lý Danh mục
          </NavItem>
          {user?.role === 'ADMIN' && (
            <NavItem to="/staff" icon={Users} onClick={onLinkClick}>
              Quản lý Nhân viên
            </NavItem>
          )}
        </nav>
      </div>
    </div>
  );
}