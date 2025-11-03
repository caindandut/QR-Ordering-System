// routes/categoryRoutes.js
import express from 'express';
import { prisma } from '../index.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Tác dụng: Đặt "trạm gác" cho TẤT CẢ các API bên dưới.
// Chỉ nhân viên hoặc admin đã đăng nhập mới được quản lý danh mục.
router.use(authenticateToken);

// --- API 1: CREATE (Tạo danh mục mới) ---
// POST /api/categories
router.post('/', async (req, res) => {
  // Lấy dữ liệu (name, name_jp) từ body
  const { name, name_jp } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Tên danh mục là bắt buộc.' });
  }

  try {
    // Dùng Prisma để tạo bản ghi mới trong bảng 'Category'
    const newCategory = await prisma.category.create({
      data: {
        name: name,
        name_jp: name_jp || '', // name_jp có thể không bắt buộc
      },
    });
    res.status(201).json(newCategory);
  } catch (error) {
    // Lỗi P2002: Lỗi trùng lặp trường @unique
    // (Nếu bạn thêm @unique cho 'name' trong schema.prisma)
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Tên danh mục đã tồn tại.' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// --- API 2: READ (Lấy tất cả danh mục) ---
// GET /api/categories
router.get('/', async (req, res) => {
  try {
    // Dùng Prisma để lấy tất cả bản ghi từ bảng 'Category'
    const categories = await prisma.category.findMany({
      orderBy: { id: 'asc' },
    });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// --- API 3: UPDATE (Cập nhật danh mục) ---
// PATCH /api/categories/:id
router.patch('/:id', async (req, res) => {
  const categoryId = parseInt(req.params.id);
  const { name, name_jp } = req.body;

  try {
    // Dùng Prisma để cập nhật
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

// --- API 4: DELETE (Xóa danh mục) ---
// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  const categoryId = parseInt(req.params.id);

  try {
    // Dùng Prisma để xóa
    await prisma.category.delete({
      where: { id: categoryId },
    });
    res.status(204).send(); // Xóa thành công
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Không tìm thấy danh mục.' });
    }
    // Lỗi P2003: Lỗi khóa ngoại
    // Tác dụng: Ngăn bạn xóa danh mục đang được Món ăn (MenuItem) sử dụng.
    if (error.code === 'P2003') {
      return res.status(409).json({
        message: 'Không thể xóa danh mục đang có chứa món ăn. Hãy chuyển các món ăn sang danh mục khác trước.',
      });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;