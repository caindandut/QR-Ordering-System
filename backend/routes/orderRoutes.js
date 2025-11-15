import express from 'express';
import { prisma } from '../index.js';

const router = express.Router();

// POST /api/orders
// Tạo một đơn hàng mới
router.post('/', async (req, res) => {
  const { table_id, customer_name, items } = req.body;

  if (!table_id || !customer_name || !items || items.length === 0) {
    return res.status(400).json({ message: 'Thông tin đơn hàng không hợp lệ.' });
  }

  try {
    // 2. Lấy giá "thật" của các món ăn từ DB
    // (Để chống gian lận - khách hàng không thể tự sửa giá)
    const itemIds = items.map((item) => item.item_id);
    const menuItemsInDb = await prisma.menuItem.findMany({
      where: {
        id: { in: itemIds },
      },
    });

    // 3. Tính toán tổng tiền (DỰA TRÊN GIÁ TỪ DB)
    let totalAmount = 0;
    const orderDetailsData = items.map((cartItem) => {
      const dbItem = menuItemsInDb.find((item) => item.id === cartItem.item_id);
      
      if (!dbItem) {
        // Nếu 1 món trong giỏ hàng không có thật trong DB
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

    // 4. "ẢO THUẬT": Dùng GIAO DỊCH (Transaction)
    //   (Hoặc cả hai cùng thành công, hoặc cả hai cùng thất bại)
    const newOrder = await prisma.$transaction(async (tx) => {
      // 4a. Tạo Hóa đơn (Order) chính
      const order = await tx.order.create({
        data: {
          tableId: parseInt(table_id, 10),
          customerName: customer_name,
          totalAmount: totalAmount,
          status: 'PENDING',
        },
      });

      // 4b. Lấy order.id (vừa tạo) và "nhét" nó vào chi tiết
      const preparedDetails = orderDetailsData.map(detail => ({
        ...detail,
        orderId: order.id,
      }));

      // 4c. Tạo các Chi tiết Đơn hàng (OrderDetail)
      await tx.orderDetail.createMany({
        data: preparedDetails,
      });

      return order; // Trả về Hóa đơn chính
    });

    // 5. TODO (Giai đoạn 3.5): Gửi tín hiệu Real-time
    // (Sau này chúng ta sẽ thêm code Socket.IO ở đây)
    // io.to('kitchen_staff').emit('new_order_received', newOrder);

    res.status(201).json(newOrder);

  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// API CÔNG KHAI
// GET /api/orders/:id
// Lấy chi tiết 1 đơn hàng (để Khách xem status)
router.get('/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        details: { // Kèm theo chi tiết món
          include: {
            menuItem: { // Kèm theo tên món
              select: { name: true, name_jp: true, imageUrl: true }
            }
          }
        },
        table: { // Kèm theo tên bàn
          select: { name: true }
        }
      }
    });
    if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// GET /api/orders?table_id=5&customer_name=...
router.get('/', async (req, res) => {
  const { table_id, customer_name } = req.query; // Lấy từ query params

  if (!table_id || !customer_name) {
    return res.status(400).json({ message: 'Thiếu thông tin bàn hoặc tên khách hàng.' });
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        tableId: parseInt(table_id, 10),
        customerName: customer_name,
      },
      include: { // Vẫn lấy chi tiết
        details: {
          include: {
            menuItem: { select: { name: true, name_jp: true, imageUrl: true } }
          }
        },
        table: { select: { name: true } }
      },
      orderBy: {
        createdAt: 'desc' // 👈 Sắp xếp đơn mới nhất lên đầu
      }
    });
    // (Lưu ý: API này không trả về lỗi nếu không tìm thấy,
    // nó chỉ trả về một mảng rỗng [])
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;