import express from 'express';
import { prisma } from '../index.js';
import { authenticateToken, authorizeAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const menu = await prisma.menuItem.findMany({
      where: {
        status: 'AVAILABLE',
      },
      include: {
        category: {
          select: { name: true, name_jp: true },
        },
      },
      orderBy: { categoryId: 'asc' },
    });
    res.status(200).json(menu);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.use(authenticateToken);

router.get('/all', async (req, res) => {
  try {
    const allItems = await prisma.menuItem.findMany({
      include: { category: { select: { name: true, name_jp: true } } },
      orderBy: { id: 'asc' },
    });
    res.status(200).json(allItems);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { name, name_jp, description, description_jp, price, imageUrl, status, categoryId } =
    req.body;

  if (!name || !price || !categoryId || !imageUrl) {
    return res
      .status(400)
      .json({ message: 'Tên, giá, hình ảnh và danh mục là bắt buộc.' });
  }

  try {
    const newItem = await prisma.menuItem.create({
      data: {
        name,
        name_jp,
        description,
        description_jp,
        price: parseInt(price),
        imageUrl,
        status: status || 'AVAILABLE',
        categoryId: parseInt(categoryId),
      },
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  const itemId = parseInt(req.params.id);
  const { name, name_jp, description, description_jp, price, imageUrl, status, categoryId } =
    req.body;

  try {
    const updatedItem = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        name,
        name_jp,
        description,
        description_jp,
        price: price ? parseInt(price) : undefined,
        imageUrl,
        status,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
      },
    });
    res.status(200).json(updatedItem);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Không tìm thấy món ăn.' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.delete('/:id', authorizeAdmin, async (req, res) => {
  const itemId = parseInt(req.params.id);

  try {
    await prisma.menuItem.delete({
      where: { id: itemId },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Không tìm thấy món ăn.' });
    }
     if (error.code === 'P2003') {
        return res.status(409).json({ message: 'Không thể xóa món ăn đang có trong đơn hàng.' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;
