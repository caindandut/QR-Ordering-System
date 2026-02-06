import express from 'express';
import { prisma } from '../index.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const tableId = parseInt(req.params.id);
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      select: {
        id: true,
        name: true,
        capacity: true,
      }
    });

    if (!table) {
      return res.status(404).json({ message: 'Không tìm thấy bàn.' });
    }
    res.status(200).json(table);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.get('/:id/check-occupied', async (req, res) => {
  try {
    const tableId = parseInt(req.params.id);
    
    const activeOrders = await prisma.order.findMany({
      where: {
        tableId: tableId,
        status: {
          in: ['PENDING', 'COOKING', 'SERVED']
        }
      },
      select: {
        id: true,
        customerName: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      isOccupied: activeOrders.length > 0,
      orders: activeOrders,
      count: activeOrders.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.use(authenticateToken);

router.post('/', async (req, res) => {
  const { name, capacity, status } = req.body;

  const staffId = req.user.userId;

  if (!name || !capacity) {
    return res.status(400).json({ message: 'Tên bàn và sức chứa là bắt buộc.' });
  }

  try {
    const newTable = await prisma.table.create({
      data: {
        name: name,
        capacity: parseInt(capacity),
        status: status || 'AVAILABLE',
      },
    });
    res.status(201).json(newTable);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Tên bàn đã tồn tại.' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { id: 'asc' },
    });
    res.status(200).json(tables);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  const tableId = parseInt(req.params.id);
  
  const { name, capacity, status } = req.body;

  try {
    const updatedTable = await prisma.table.update({
      where: { id: tableId },
      data: {
        name: name,
        capacity: capacity ? parseInt(capacity) : undefined,
        status: status,
      },
    });
    res.status(200).json(updatedTable);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Không tìm thấy bàn.' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const tableId = parseInt(req.params.id);

  try {
    await prisma.table.delete({
      where: { id: tableId },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Không tìm thấy bàn.' });
    }
    if (error.code === 'P2003') {
        return res.status(409).json({ message: 'Không thể xóa bàn đang có đơn hàng. Hãy ẩn bàn đi.' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;
