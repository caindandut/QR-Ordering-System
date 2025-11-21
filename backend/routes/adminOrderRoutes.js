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
        staff: { // Lấy thông tin người xử lý
          select: { id: true, name: true, avatarUrl: true }
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
    // Lấy userId từ token (người đang cập nhật)
    const userId = req.user.userId;
    
    // 1. Cập nhật Database (lưu cả staffId khi cập nhật trạng thái)
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: status,
        staffId: userId // Lưu người xử lý
      },
      // (Lấy lại data đầy đủ để "phát" cho Admin khác)
      include: { 
        table: { select: { name: true } },
        staff: { select: { id: true, name: true, avatarUrl: true } },
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

// POST /api/admin/orders/:id/send-bill
// Gửi hóa đơn cho khách hàng
router.post('/:id/send-bill', async (req, res) => {
  const orderId = parseInt(req.params.id);

  try {
    // Lấy thông tin đơn hàng đầy đủ
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: { select: { id: true, name: true } },
        details: {
          include: {
            menuItem: { select: { name: true, name_jp: true, imageUrl: true } }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    }

    // Kiểm tra trạng thái đơn hàng phải là SERVED
    if (order.status !== 'SERVED') {
      return res.status(400).json({ 
        message: 'Chỉ có thể gửi hóa đơn cho đơn hàng đã được phục vụ.' 
      });
    }

    // Emit socket event gửi hóa đơn đến khách hàng
    io.to(`order_${orderId}`).emit('bill_received', {
      orderId: order.id,
      tableName: order.table.name,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      details: order.details,
      createdAt: order.createdAt,
    });

    res.status(200).json({ 
      message: 'Hóa đơn đã được gửi đến khách hàng.',
      orderId: order.id
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/admin/orders/create
// Tạo đơn hàng thủ công (cho admin/nhân viên)
router.post('/create', async (req, res) => {
  const { table_id, customer_name, items } = req.body;
  const userId = req.user.userId; // Lấy userId từ token

  if (!table_id || !customer_name || !items || items.length === 0) {
    return res.status(400).json({ message: 'Thông tin đơn hàng không hợp lệ.' });
  }

  try {
    // Lấy giá "thật" của các món ăn từ DB
    const itemIds = items.map((item) => item.item_id);
    const menuItemsInDb = await prisma.menuItem.findMany({
      where: {
        id: { in: itemIds },
      },
    });

    // Tính toán tổng tiền
    let totalAmount = 0;
    const orderDetailsData = items.map((cartItem) => {
      const dbItem = menuItemsInDb.find((item) => item.id === cartItem.item_id);
      
      if (!dbItem) {
        throw new Error(`Món ăn với ID ${cartItem.item_id} không tồn tại.`);
      }
      
      const itemTotal = dbItem.price * cartItem.quantity;
      totalAmount += itemTotal;
      
      return {
        menuItemId: dbItem.id,
        quantity: cartItem.quantity,
        priceAtOrder: dbItem.price
      };
    });

    // Tạo đơn hàng với staffId
    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          tableId: parseInt(table_id, 10),
          customerName: customer_name,
          totalAmount: totalAmount,
          status: 'PENDING',
          staffId: userId, // Lưu người tạo đơn
        },
      });

      const preparedDetails = orderDetailsData.map(detail => ({
        ...detail,
        orderId: order.id,
      }));

      await tx.orderDetail.createMany({
        data: preparedDetails,
      });

      return order;
    });

    // Lấy đơn hàng đầy đủ với relations
    const orderWithDetails = await prisma.order.findUnique({
      where: { id: newOrder.id },
      include: {
        table: { select: { name: true } },
        staff: { select: { id: true, name: true, avatarUrl: true } },
        details: {
          include: {
            menuItem: { select: { name: true, imageUrl: true } }
          }
        }
      }
    });

    // Emit socket event
    io.emit('new_order_received', orderWithDetails);

    res.status(201).json(orderWithDetails);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/admin/orders/pending-count
// Lấy số lượng đơn hàng đang chờ duyệt (cho notification badge)
router.get('/pending-count', async (req, res) => {
  try {
    const count = await prisma.order.count({
      where: {
        status: 'PENDING'
      }
    });
    
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;