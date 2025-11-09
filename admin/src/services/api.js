// src/lib/api.js
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// 1. Tạo một "instance" (phiên bản) của Axios
const api = axios.create({
  // TẠI SAO CẦN baseURL?
  // Tác dụng: Bạn không cần gõ 'http://localhost:8080' mỗi lần gọi API.
  // Bạn chỉ cần gõ: api.get('/api/menu')
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});

// 2. Đây là "Trạm gác" Interceptor
api.interceptors.request.use(
  (config) => {
    // 3. Lấy token từ "Não" (Zustand)
    // TẠI SAO DÙNG .getState()?
    // Tác dụng: Lấy state ngay lập tức mà không cần 
    // hook (vì đây không phải component)
    const token = useAuthStore.getState().accessToken;

    // 4. Gắn token vào header nếu nó tồn tại
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Xử lý lỗi
    return Promise.reject(error);
  }
);

// (Sau này chúng ta sẽ thêm logic "refresh token" vào đây)

// 👇 [KẾ HOẠCH B] (Response Interceptor - Trạm gác Phản hồi)
// Đây là "trạm gác" cho các phản hồi *BỊ LỖI*
api.interceptors.response.use(
  // 1. Phản hồi thành công (2xx): Cứ cho nó đi qua
  (response) => response,
  
  // 2. Phản hồi bị lỗi (4xx, 5xx): Kích hoạt "Kế hoạch B"
  async (error) => {
    const originalRequest = error.config;
    
    // 3. CHỈ xử lý nếu lỗi là 403 (Token hết hạn) VÀ
    //    chúng ta chưa thử lại request này (`_retry`)
    if (error.response?.status === 403 && 
      originalRequest.url !== '/api/auth/refresh' &&
      !originalRequest._retry
    ) {
      
      originalRequest._retry = true; // Đánh dấu là đã thử 1 lần
      
      const { refreshToken, setAccessToken, logout } = useAuthStore.getState();

      if (!refreshToken) {
        logout(); // Nếu không có refresh token, logout luôn
        return Promise.reject(error);
      }

      try {
        // 4. "Gia hạn vé": Gọi API /refresh
        const response = await api.post('/api/auth/refresh', { refreshToken });
        
        const { accessToken: newAccessToken } = response.data;
        
        // 5. Cập nhật "bộ não" với token mới
        setAccessToken(newAccessToken);
        
        // 6. Cập nhật header của request gốc
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        
        // 7. Gửi lại request gốc (lần này sẽ thành công)
        return api(originalRequest);
        
      } catch (refreshError) {
        // 8. NẾU "Gia hạn" THẤT BẠI (vd: refreshToken cũng hết hạn)
        //    Logout và "đá" người dùng về trang login
        logout();
        window.location.href = '/login'; // Chuyển hướng "cứng"
        return Promise.reject(refreshError);
      }
    }
    
    // 9. Nếu là lỗi khác (không phải 403), cứ báo lỗi như bình thường
    return Promise.reject(error);
  }
);

export default api;