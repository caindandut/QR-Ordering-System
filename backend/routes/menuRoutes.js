// routes/menuRoutes.js
import express from 'express';
import { authenticateToken, authorizeAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- API Công khai (Không cần trạm gác) ---
// Ai cũng xem được menu
router.get('/', (req, res) => {
  res.send('Đây là menu cho khách xem (công khai)');
});

// --- API Bảo mật (Cần trạm gác) ---

// TẠI SAO ĐỂ authenticateToken VÀO ĐÂY?
// Tác dụng: Express sẽ chạy hàm authenticateToken TRƯỚC
// khi chạy hàm (req, res) => { ... }
// Đây chính là cách chúng ta đặt "trạm gác"
router.post('/', authenticateToken, (req, res) => {
  // Nhờ "trạm gác", ta có thể biết ai đã tạo món ăn này
  const adminName = req.user.userId; // (Sẽ lấy tên từ ID sau)
  res.send(`(Đã được bảo vệ) Admin ${adminName} vừa tạo 1 món ăn mới.`);
});

// --- API Bảo mật Cấp cao (Cần 2 trạm gác) ---
// Chỉ Admin mới được xóa món ăn
router.delete('/:id', authenticateToken, authorizeAdmin, (req, res) => {
  // Nếu bạn không phải Admin, bạn sẽ bị chặn ở authorizeAdmin
  // và không bao giờ thấy được message này
  res.send(`(Siêu bảo vệ) Admin ${req.user.role} đã xóa món ăn.`);
});

export default router;