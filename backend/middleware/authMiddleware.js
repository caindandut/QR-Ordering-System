// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';

// Tên hàm 'authenticateToken' có nghĩa là "xác thực token"
export const authenticateToken = async (req, res, next) => {
  // 1. Lấy token từ header của request
  // Định dạng chuẩn là: "Bearer <token>"
  const authHeader = req.headers['authorization'];
  
  // Tách "Bearer " ra để lấy phần token
  const token = authHeader && authHeader.split(' ')[1];

  // 2. Kiểm tra xem token có tồn tại không
  if (token == null) {
    // Nếu không có token, trả về lỗi 401 (Unauthorized)
    return res.status(401).json({ message: 'Không tìm thấy token.' });
  }

  // 3. Xác thực token (Kiểm tra chữ ký và hạn)
  // TẠI SAO DÙNG process.env.ACCESS_TOKEN_SECRET?
  // Tác dụng: Chúng ta dùng "bí mật" của Access Token
  // để giải mã nó.
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
    // 4. Xử lý kết quả xác thực
    if (err) {
      // Nếu token hết hạn (hoặc không hợp lệ), trả về lỗi 403 (Forbidden)
      // (403 nghĩa là "Tôi biết bạn là ai, nhưng bạn không có quyền"
      //  hoặc "Token của bạn đã hết hạn")
      return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }

    // 5. Token hợp lệ!
    // TÁC DỤNG (RẤT QUAN TRỌNG):
    // Chúng ta "đính kèm" thông tin payload (chứa userId, role)
    // vào chính đối tượng `req` (request).
    // Giờ đây, *bất kỳ* API nào chạy sau "trạm gác" này
    // đều có thể truy cập `req.user` để biết ai đang gọi API.
    req.user = payload;
    
    // "OK, bạn được qua."
    // Cho phép request đi tiếp đến API handler chính
    next(); 
  });
};

// (Tùy chọn nâng cao) Tạo 1 trạm gác nữa để check Role
export const authorizeAdmin = (req, res, next) => {
  // Hàm này PHẢI chạy SAU hàm authenticateToken
  if (req.user.role !== 'ADMIN') {
    // Nếu không phải ADMIN, cấm!
    return res.status(403).json({ message: 'Yêu cầu quyền Admin.' });
  }
  // Nếu là ADMIN, cho qua
  next();
};