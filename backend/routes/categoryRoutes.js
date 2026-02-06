import express from 'express';
import { prisma } from '../index.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', async (req, res) => {
  const { name, name_jp } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Tên danh mục là bắt buộc.' });
  }

  try {
    const newCategory = await prisma.category.create({
      data: {
        name: name,
        name_jp: name_jp || '',
      },
    });
    res.status(201).json(newCategory);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Tên danh mục đã tồn tại.' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: 'asc' },
    });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  const categoryId = parseInt(req.params.id);
  const { name, name_jp } = req.body;

  try {
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: name,
        name_jp: name_jp,
      },
    });
    res.status(200).json(updatedCategory);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Không tìm thấy danh mục.' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const categoryId = parseInt(req.params.id);

  try {
    await prisma.category.delete({
      where: { id: categoryId },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Không tìm thấy danh mục.' });
    }
    if (error.code === 'P2003') {
      return res.status(409).json({
        message: 'Không thể xóa danh mục đang có chứa món ăn. Hãy chuyển các món ăn sang danh mục khác trước.',
      });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;
