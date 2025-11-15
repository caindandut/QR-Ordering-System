import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User, LogOut, Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import Sidebar from './Sidebar';
import { ModeToggle } from "./ModeToggle";
import { useToast } from '@/hooks/use-toast';

export default function Header() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      // 4. Chờ cho "bộ não" gọi API và xóa state
      await logout();
      
      // 5. Hiển thị thông báo thành công
      toast({
        title: "Đã đăng xuất",
        description: "Bạn đã đăng xuất thành công. Hẹn gặp lại!",
        // variant: "success"
      });

    } catch (error) {
      // (Phòng trường hợp logout bị lỗi, hiếm khi xảy ra)
      console.error("Logout error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể đăng xuất. Vui lòng thử lại.",
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
      
      {/* Toggle theme và Avatar */}
      <div className="flex items-center gap-2">
        <ModeToggle />
        
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
                <span>Tài khoản</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 dark:text-red-400 focus:text-red-600 dark:focus:text-red-300">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}