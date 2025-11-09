import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const AdminRoute = () => {
  // 1. Lấy thông tin user (đã đăng nhập)
  const user = useAuthStore((state) => state.user);

  // 2. Kiểm tra vai trò
  if (user?.role !== 'ADMIN') {
    // 3. Nếu không phải Admin, "đá" về trang chủ
    //    (họ vẫn đăng nhập, nên ta đá về '/', không phải '/login')
    return <Navigate to="/" replace />;
  }

  // 4. Nếu là Admin, cho phép đi tiếp
  //    (Render các trang con được bọc bên trong)
  return <Outlet />;
};