import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    // [SỬA] Bỏ "justify-between" đi, chỉ cần "flex items-center"
    <header className="flex h-16 items-center border-b bg-white px-6 gap-4">
      {/* 1. Nút Hamburger (Chỉ hiện trên Mobile) */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        
        {/* [SỬA] Thêm `w-64` để Sheet có chiều rộng đúng,
            sửa lỗi khoảng trắng. */}
        <SheetContent side="left" className="p-0 w-64">
          
          {/* [SỬA] Truyền hàm để đóng Sheet khi bấm link */}
          <Sidebar onLinkClick={() => setIsSheetOpen(false)} isMobileSheet={true} />
          
        </SheetContent>
      </Sheet>

      {/* 2. [SỬA] Thêm 1 div "Spacer" (bộ đệm)
          Class `flex-grow` sẽ "đẩy" tất cả những gì
          theo sau nó ra phía bên phải.
          Đây chính là chìa khóa sửa lỗi Avatar bên trái.
      */}
      <div className="flex-grow"></div>

      {/* 3. Dropdown Avatar (Luôn ở bên phải) */}
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
            <p className="text-xs text-gray-500">{user?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Tài khoản</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-500">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Đăng xuất</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}