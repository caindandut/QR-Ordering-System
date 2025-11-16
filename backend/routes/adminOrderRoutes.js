import express from 'express';
import { prisma, io } from '../index.js'; 
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/admin/orders
// Lấy TẤT CẢ các đơn hàng (cho trang Quản lý Đơn hàng)
router.get('/', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      // Lấy kèm "chi tiết" để Admin biết đơn hàng có gì
      include: {
        table: { // Lấy tên bàn
          select: { name: true }
        },
        details: { // Lấy các món
          include: {
            menuItem: { // Lấy tên món
              select: { name: true, imageUrl: true }
            }
          }
        }
      },
      // Sắp xếp đơn mới nhất lên đầu
      orderBy: {
        createdAt: 'desc' 
      }
    });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// [API MỚI]
// PATCH /api/admin/orders/:id/status
// Cập nhật trạng thái đơn hàng (Bếp/Thu ngân gọi)
router.patch('/:id/status', async (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status } = req.body; // vd: "COOKING", "SERVED", "PAID"
  
  try {
    // 1. Cập nhật Database
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status },
      // (Lấy lại data đầy đủ để "phát" cho Admin khác)
      include: { 
        table: { select: { name: true } },
        details: { include: { menuItem: { select: { name: true, imageUrl: true }}}}
      }
    });

    // 2. "ĐẨY" (EMIT) TÍN HIỆU REAL-TIME
    //    Gửi tín hiệu đến "phòng" (room) cụ thể
    //    (ví dụ: "order_123")
    io.to(`order_${orderId}`).emit('order_status_updated', {
      orderId: orderId,
      newStatus: status,
    });

    io.emit('order_updated_for_admin', updatedOrder);
    
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;