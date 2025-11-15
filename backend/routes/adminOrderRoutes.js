import express from 'express';
import { prisma, io } from '../index.js'; 
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

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
    });

    // 2. "ĐẨY" (EMIT) TÍN HIỆU REAL-TIME
    //    Gửi tín hiệu đến "phòng" (room) cụ thể
    //    (ví dụ: "order_123")
    io.to(`order_${orderId}`).emit('order_status_updated', {
      orderId: orderId,
      newStatus: status,
    });
    
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;