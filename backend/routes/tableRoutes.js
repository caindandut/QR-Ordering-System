import express from 'express';
import { prisma } from '../index.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const tableId = parseInt(req.params.id);
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      select: { // Chỉ trả về dữ liệu an toàn
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

// TẠI SAO DÙNG router.use(authenticateToken)?
// Tác dụng: Áp dụng "trạm gác" cho TẤT CẢ các API bên dưới.
// Điều này có nghĩa là mọi API trong file này (tạo, sửa, xóa bàn)
// đều YÊU CẦU người dùng phải đăng nhập.
// Nó gọn gàng hơn là thêm `authenticateToken` vào từng API một.
router.use(authenticateToken);

// --- API 1: CREATE (Tạo bàn mới) ---
// POST /api/tables
router.post('/', async (req, res) => {
  // Lấy dữ liệu (name, capacity) từ body của request
  const { name, capacity, status } = req.body;

  // Lấy ID của nhân viên đang thực hiện hành động
  // Tác dụng: Để sau này ghi log "Ai đã tạo bàn này?"
  const staffId = req.user.userId;

  if (!name || !capacity) {
    return res.status(400).json({ message: 'Tên bàn và sức chứa là bắt buộc.' });
  }

  try {
    // Dùng Prisma để tạo bản ghi mới trong bảng 'Table'
    const newTable = await prisma.table.create({
      data: {
        name: name,
        capacity: parseInt(capacity), // Đảm bảo capacity là số
        status: status || 'AVAILABLE', // Mặc định nếu không cung cấp
      },
    });
    // Trả về 201 (Created) cùng với dữ liệu bàn mới
    res.status(201).json(newTable);
  } catch (error) {
    // Bắt lỗi (ví dụ: tên bàn bị trùng lặp vì ta set @unique)
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Tên bàn đã tồn tại.' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// --- API 2: READ (Lấy tất cả bàn) ---
// GET /api/tables
router.get('/', async (req, res) => {
  try {
    // Dùng Prisma để lấy tất cả bản ghi từ bảng 'Table'
    const tables = await prisma.table.findMany({
      orderBy: { id: 'asc' }, // Sắp xếp theo ID tăng dần
    });
    res.status(200).json(tables);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// --- API 3: UPDATE (Cập nhật bàn) ---
// PATCH /api/tables/:id
// TẠI SAO DÙNG PATCH?
// Tác dụng: PATCH dùng để cập nhật *một phần*.
// Ví dụ, bạn chỉ muốn đổi `status` mà không cần gửi lại `name`.
router.patch('/:id', async (req, res) => {
  // Lấy ID của bàn từ URL (vd: /api/tables/15)
  // TẠI SAO DÙNG req.params?
  // Tác dụng: `req.params` dùng để lấy các biến trên URL (được định nghĩa bằng dấu ':')
  const tableId = parseInt(req.params.id);
  
  // Lấy dữ liệu cần cập nhật từ `req.body`
  const { name, capacity, status } = req.body;

  try {
    // Dùng Prisma để cập nhật
    const updatedTable = await prisma.table.update({
      where: { id: tableId }, // Tìm bàn có ID này
      data: { // Dữ liệu mới (Prisma tự bỏ qua các trường 'undefined')
        name: name,
        capacity: capacity ? parseInt(capacity) : undefined,
        status: status,
      },
    });
    res.status(200).json(updatedTable);
  } catch (error) {
    // Bắt lỗi (ví dụ: không tìm thấy bàn để cập nhật)
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Không tìm thấy bàn.' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// --- API 4: DELETE (Xóa bàn) ---
// DELETE /api/tables/:id
router.delete('/:id', async (req, res) => {
  const tableId = parseInt(req.params.id);

  try {
    // Dùng Prisma để xóa
    await prisma.table.delete({
      where: { id: tableId },
    });
    // Trả về 204 (No Content) - Xóa thành công, không cần trả về dữ liệu
    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Không tìm thấy bàn.' });
    }
    // Bắt lỗi nếu xóa bàn đang có đơn hàng (lỗi khóa ngoại)
    if (error.code === 'P2003') {
        return res.status(409).json({ message: 'Không thể xóa bàn đang có đơn hàng. Hãy ẩn bàn đi.' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;