import express from 'express';
import { prisma } from '../index.js';
import { authenticateToken, authorizeAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// TẠI SAO LẠI CÓ 2 PHẦN?
// Tác dụng: Chúng ta chia API Món ăn làm 2 phần:
// 1. PUBLIC (Công khai): Cho khách hàng (React App của Khách) xem menu.
// 2. PROTECTED (Bảo mật): Cho Admin/Nhân viên (React App của Admin) quản lý.

// ============================================
// === 1. API CÔNG KHAI (Cho Khách hàng) ===
// ============================================

// GET /api/menu (Lấy menu CÔNG KHAI)
// API này không dùng 'authenticateToken' -> Ai cũng gọi được
router.get('/', async (req, res) => {
  try {
    const menu = await prisma.menuItem.findMany({
      where: {
        status: 'AVAILABLE', // Chỉ lấy các món "Có sẵn"
      },
      // TẠI SAO DÙNG `include`?
      // Tác dụng: Lấy luôn thông tin của Bảng `Category` liên quan
      // để React có thể gom nhóm (vd: Nhóm 'Món chính', 'Đồ uống')
      include: {
        category: {
          select: { name: true, name_jp: true }, // Chỉ lấy tên category
        },
      },
      orderBy: { categoryId: 'asc' },
    });
    res.status(200).json(menu);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// ============================================
// === 2. API BẢO MẬT (Cho Admin/Nhân viên) ===
// ============================================

// TÁC DỤNG: Đặt "trạm gác" cho tất cả các API bên dưới
router.use(authenticateToken);

// GET /api/menu/all (Lấy TẤT CẢ món ăn - Cho trang Admin)
router.get('/all', async (req, res) => {
  try {
    // API này lấy tất cả món, bao gồm cả món "Ẩn" (HIDDEN)
    const allItems = await prisma.menuItem.findMany({
      include: { category: { select: { name: true } } },
      orderBy: { id: 'asc' },
    });
    res.status(200).json(allItems);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/menu (Tạo món ăn mới)
router.post('/', async (req, res) => {
  const { name, name_jp, description, price, imageUrl, status, categoryId } =
    req.body;

  if (!name || !price || !categoryId || !imageUrl) {
    return res
      .status(400)
      .json({ message: 'Tên, giá, hình ảnh và danh mục là bắt buộc.' });
  }

  // LƯU Ý QUAN TRỌNG VỀ `imageUrl`
  // Hiện tại, chúng ta đang "tin tưởng" React App sẽ gửi lên
  // một URL (text) của ảnh.
  // Ở phần sau, chúng ta sẽ làm API Upload Ảnh,
  // React sẽ upload ảnh lên server TRƯỚC, nhận về URL,
  // sau đó mới gọi API này.

  try {
    const newItem = await prisma.menuItem.create({
      data: {
        name,
        name_jp,
        description,
        price: parseInt(price),
        imageUrl, // Sẽ là URL từ Cloudinary
        status: status || 'AVAILABLE',
        categoryId: parseInt(categoryId),
      },
    });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// PATCH /api/menu/:id (Cập nhật món ăn)
router.patch('/:id', async (req, res) => {
  const itemId = parseInt(req.params.id);
  // Lấy các trường có thể được cập nhật
  const { name, name_jp, description, price, imageUrl, status, categoryId } =
    req.body;

  try {
    const updatedItem = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        name,
        name_jp,
        description,
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

// DELETE /api/menu/:id (Xóa món ăn)
// TẠI SAO Ở ĐÂY DÙNG `authorizeAdmin`?
// Tác dụng: Xóa là một hành động nguy hiểm.
// Theo logic thông thường, ta có thể chỉ cho phép Admin xóa,
// còn Nhân viên chỉ được sửa.
// (Nếu bạn muốn Nhân viên cũng xóa được, chỉ cần bỏ `authorizeAdmin` đi)
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