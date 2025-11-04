// src/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware'; // 👈 Import middleware persist
import api from '../services/api';
// TẠI SAO DÙNG persist?
// Tác dụng: Tự động lưu "kho" này vào localStorage.
// Khi F5, user không bị văng ra.

// Dùng create() để tạo kho
// persist() bọc bên ngoài để lưu trữ
export const useAuthStore = create(
  persist(
    (set) => ({
      // 1. Dữ liệu (State)
      user: null,
      accessToken: null,
      refreshToken: null,
    
      // 2. Hành động (Actions)
      
      // Hàm này được gọi khi login thành công
      login: async (email, password) => {
        // `set` là hàm cập nhật state, `get` là hàm đọc state
        try {
          // 1. Gọi API Login (từ Giai đoạn 1)
          const response = await api.post('/api/auth/login', {
            email: email,
            password: password,
          });

          // 2. Lấy dữ liệu trả về
          const { user, accessToken, refreshToken } = response.data;
          
          // 3. Cập nhật "Não" (State)
          set({
            user: user,
            accessToken: accessToken,
            refreshToken: refreshToken,
          });
          
          return { success: true };
        } catch (error) {
          return { success: false, error: error.response?.data?.message || "Lỗi đăng nhập" };
        }
      },
        
      // Hàm này được gọi khi logout
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        }),
      
      // (Chúng ta sẽ thêm logic gọi API vào đây sau)
    }),
    {
      name: 'auth-storage', // Tên key trong localStorage
    }
  )
);