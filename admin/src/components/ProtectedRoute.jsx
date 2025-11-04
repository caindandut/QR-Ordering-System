// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute = () => {
  // 1. Lấy "vé" (accessToken) từ "bộ não" Zustand
  // TẠI SAO DÙNG (state) => state.accessToken?
  // Tác dụng: Đây là "selector". Nó chỉ "theo dõi"
  // miếng state `accessToken`. Nếu các state khác (như user.name)
  // thay đổi, component này sẽ KHÔNG render lại. Rất tối ưu!
  const accessToken = useAuthStore((state) => state.accessToken);

  // 2. Kiểm tra "vé"
  if (!accessToken) {
    // 3a. KHÔNG CÓ VÉ: Chuyển hướng về /login
    // TẠI SAO DÙNG `replace`?
    // Tác dụng: Nó thay thế (replace) trang hiện tại
    // trong lịch sử (history) bằng trang /login.
    // Điều này ngăn người dùng nhấn nút "Back" (Quay lại)
    // trên trình duyệt để quay lại trang Dashboard.
    return <Navigate to="/login" replace />;
  }

  // 3b. CÓ VÉ: Cho phép đi tiếp
  // TÁC DỤNG CỦA <Outlet />:
  // Nó render bất cứ "route con" (child route) nào
  // được định nghĩa bên trong ProtectedRoute (trong file main.jsx).
  return <Outlet />;
};