import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
// TẠI SAO DÙNG persist?
// Tác dụng: Tự động lưu "kho" này vào localStorage.
// Khi F5, user không bị văng ra.

// Dùng create() để tạo kho
// persist() bọc bên ngoài để lưu trữ
export const useAuthStore = create(
  persist(
    (set, get) => ({
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

          // Cập nhật header mặc định của Axios
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          
          return { success: true };
        } catch (error) {
          return { success: false, error: error.response?.data?.message || "Lỗi đăng nhập" };
        }
      },

      // 👇 [KỸ NĂNG MỚI 1] Chỉ cập nhật accessToken
      // Dùng khi "gia hạn vé" thành công
      setAccessToken: (token) => {
        set({ accessToken: token });
        // Cập nhật header mặc định của Axios
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },

      // 👇 [KỸ NĂNG MỚI 2] Nâng cấp Logout
      // Giờ nó sẽ gọi API để hủy Refresh Token
        
      // Hàm này được gọi khi logout
      logout: async () => {
        const { refreshToken } = get(); // Lấy refreshToken hiện tại

        if (refreshToken) {
          try {
            // Bảo backend hủy token này
            await api.post('/api/auth/logout', { refreshToken });
          } catch (error) {
            console.error("Lỗi khi logout:", error);
          }
      }
      set({
          user: null,
          accessToken: null,
          refreshToken: null,
      });

      // Xóa header mặc định
        delete api.defaults.headers.common['Authorization'];
    },

    updateUser: (newUserData) => {
      set((state) => ({
        user: {
          ...state.user,
          ...newUserData,
        }
      }));
    }
  }),
    {
      name: 'auth-storage', // Tên key trong localStorage
      // Kỹ năng phụ: Tự động "cài đặt" token vào Axios khi F5
      onRehydrateStorage: () => (state) => {
        if (state.accessToken) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`;
        }
      }
    }
  )
);