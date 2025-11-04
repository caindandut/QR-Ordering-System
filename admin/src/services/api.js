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
    if (token) {
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

export default api;