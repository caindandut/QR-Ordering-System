import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';

export const ProtectedRoute = () => {
  // 1. Lấy "vé" (accessToken) từ "bộ não" Zustand
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();

  // 2. Kiểm tra nếu có accessToken nhưng không có refreshToken
  //    (Trường hợp dữ liệu localStorage bị hỏng)
  useEffect(() => {
    if (accessToken && !refreshToken) {
      // Dữ liệu không nhất quán, logout để dọn dẹp
      logout();
    }
  }, [accessToken, refreshToken, logout]);

  // 3. Kiểm tra "vé"
  if (!accessToken) {
    // 3a. KHÔNG CÓ VÉ: Chuyển hướng về /login
    // `replace` thay thế trang hiện tại trong history
    // Điều này ngăn người dùng nhấn nút "Back" 
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3b. CÓ VÉ: Cho phép đi tiếp
  // <Outlet /> render các route con
  return <Outlet />;
};