import { Outlet } from 'react-router-dom';

// Khung này chỉ đơn giản là render "chỗ giữ chỗ"
// Tác dụng: Để bọc toàn bộ ứng dụng, sau này dùng để
// thêm ThemeProvider (Darkmode), Toaster (Thông báo)...
export default function RootLayout() {
  return (
    <main>
      <Outlet />
    </main>
  );
}