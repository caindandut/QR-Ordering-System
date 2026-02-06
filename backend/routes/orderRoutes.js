import express from 'express';
import { prisma, io } from '../index.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { table_id, customer_name, items } = req.body;

  if (!table_id || !customer_name || !items || items.length === 0) {
    return res.status(400).json({ message: 'Thông tin đơn hàng không hợp lệ.' });
  }

  try {
    const itemIds = items.map((item) => item.item_id);
    const menuItemsInDb = await prisma.menuItem.findMany({
      where: {
        id: { in: itemIds },
      },
    });

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

    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          tableId: parseInt(table_id, 10),
          customerName: customer_name,
          totalAmount: totalAmount,
          status: 'PENDING',
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

    io.emit('new_order_received', orderWithDetails);

    res.status(201).json(newOrder);

  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        details: {
          include: {
            menuItem: {
              select: { name: true, name_jp: true, imageUrl: true }
            }
          }
        },
        table: {
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

router.get('/', async (req, res) => {
  const { table_id, customer_name } = req.query;

  if (!table_id || !customer_name) {
    return res.status(400).json({ message: 'Thiếu thông tin bàn hoặc tên khách hàng.' });
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        tableId: parseInt(table_id, 10),
        customerName: customer_name,
      },
      include: {
        details: {
          include: {
            menuItem: { select: { name: true, name_jp: true, imageUrl: true } }
          }
        },
        table: { select: { name: true } }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.post('/:id/request-payment', async (req, res) => {
  const orderId = parseInt(req.params.id);

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: { select: { id: true, name: true } },
        details: {
          include: {
            menuItem: { select: { name: true, imageUrl: true } }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    }

    if (order.status !== 'SERVED') {
      return res.status(400).json({ 
        message: 'Chỉ có thể yêu cầu thanh toán cho đơn hàng đã được phục vụ.' 
      });
    }

    io.emit('payment_requested', {
      orderId: order.id,
      tableId: order.table.id,
      tableName: order.table.name,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
    });

    res.status(200).json({ 
      message: 'Yêu cầu thanh toán đã được gửi đến nhân viên.',
      orderId: order.id
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.post('/:id/cancel', async (req, res) => {
  const orderId = parseInt(req.params.id);

  try {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
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

    if (!existingOrder) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    }

    if (existingOrder.status !== 'PENDING') {
      return res.status(400).json({
        message: 'Chỉ có thể hủy các đơn hàng đang chờ xử lý.'
      });
    }

    const cancelledOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
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

    io.to(`order_${orderId}`).emit('order_status_updated', {
      orderId,
      newStatus: 'CANCELLED',
    });

    io.emit('order_updated_for_admin', cancelledOrder);

    res.status(200).json({
      message: 'Đơn hàng đã được hủy.',
      order: cancelledOrder,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.delete('/clear-session', async (req, res) => {
  const { table_id, customer_name } = req.body;

  if (!table_id || !customer_name) {
    return res.status(400).json({ message: 'Thiếu thông tin bàn hoặc tên khách hàng.' });
  }

  try {
    const result = await prisma.order.updateMany({
      where: {
        tableId: parseInt(table_id, 10),
        customerName: customer_name,
        status: 'PENDING'
      },
      data: {
        status: 'CANCELLED'
      }
    });

    res.status(200).json({ 
      message: 'Đã hủy phiên thành công',
      cancelledOrders: result.count 
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;
