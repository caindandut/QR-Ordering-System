import { Outlet } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";

// Khung này chỉ đơn giản là render "chỗ giữ chỗ"
// Tác dụng: Để bọc toàn bộ ứng dụng, sau này dùng để
// thêm ThemeProvider (Darkmode), Toaster (Thông báo)...
export default function RootLayout() {
  return (
    <main>
      <Outlet />
      {/* 👇 2. ĐẶT "Ổ ĐIỆN" VÀO ĐÂY */}
      {/* Bây giờ, <Toaster /> (và <ToastProvider> bên trong nó)
        sẽ "bọc" tất cả các trang con (rendered bởi <Outlet />).
        Khi ManageTablesPage gọi useToast(), nó sẽ tìm thấy Provider.
      */}
      <Toaster />
    </main>
  );
}