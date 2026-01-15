import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// 1. Tạo một "instance" (phiên bản) của Axios
const api = axios.create({
  // TẠI SAO CẦN baseURL?
  // Tác dụng: Bạn không cần gõ 'http://localhost:8080' mỗi lần gọi API.
  // Bạn chỉ cần gõ: api.get('/api/menu')
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});

// [QUAN TRỌNG] Biến để ngăn nhiều request refresh cùng lúc (Race Condition)
let isRefreshing = false;
let failedQueue = [];

// Helper: Xử lý các request đang chờ trong queue
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

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
    //    không phải là request refresh token
    if (error.response?.status === 403 && 
      originalRequest.url !== '/api/auth/refresh'
    ) {
      
      // [FIX RACE CONDITION] Nếu đang refresh, đưa request vào hàng đợi
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true; // Đánh dấu là đã thử 1 lần
      isRefreshing = true; // Đánh dấu đang refresh
      
      const { refreshToken, setAccessToken, logout } = useAuthStore.getState();

      if (!refreshToken) {
        processQueue(error, null); // Từ chối tất cả request trong queue
        isRefreshing = false;
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
        
        // [FIX] Xử lý tất cả request đang chờ trong queue
        processQueue(null, newAccessToken);
        
        // 7. Reset flag
        isRefreshing = false;
        
        // 8. Gửi lại request gốc (lần này sẽ thành công)
        return api(originalRequest);
        
      } catch (refreshError) {
        // 9. NẾU "Gia hạn" THẤT BẠI (vd: refreshToken cũng hết hạn)
        processQueue(refreshError, null); // Từ chối tất cả request trong queue
        isRefreshing = false;
        
        // Logout - React Router sẽ tự động redirect thông qua ProtectedRoute
        logout();
        // KHÔNG dùng window.location.href để tránh conflict với React Router
        return Promise.reject(refreshError);
      }
    }
    
    // 10. Nếu là lỗi khác (không phải 403), cứ báo lỗi như bình thường
    return Promise.reject(error);
  }
);

export default api;