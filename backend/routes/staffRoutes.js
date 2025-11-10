import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index.js';
import { authenticateToken, authorizeAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeAdmin);

// GET /api/staff
router.get('/', async (req, res) => {
  try {
    const staffList = await prisma.user.findMany({
      // Lấy tất cả user (cả Admin và Staff)
      orderBy: { id: 'asc' },
      // Xóa trường 'password' khỏi kết quả trả về
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
        role: true,
        createdAt: true,
      }
    });
    res.status(200).json(staffList);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

//CREATE 
// POST /api/staff
router.post('/', async (req, res) => {
  const { name, email, password, phone, role, avatarUrl } = req.body;

  // 1. Kiểm tra đầu vào (đặc biệt là password)
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Tên, email, mật khẩu và vai trò là bắt buộc.' });
  }

  try {
    // 2. Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Tạo user mới
    const newStaff = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role, // (ADMIN hoặc STAFF)
        avatarUrl,
      },
      select: { }
    });
    
    res.status(201).json(newStaff);

  } catch (error) {
    if (error.code === 'P2002') { // Lỗi trùng lặp (email)
      return res.status(409).json({ message: 'Email này đã được sử dụng.' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});


// PATCH /api/staff/:id
router.patch('/:id', async (req, res) => {
  const staffId = parseInt(req.params.id);
  const { name, email, password, phone, role, avatarUrl } = req.body;

  try {
    const dataToUpdate = {};

    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email;
    if (phone) dataToUpdate.phone = phone;
    if (role) dataToUpdate.role = role;
    if (avatarUrl) dataToUpdate.avatarUrl = avatarUrl;

    // 2. LOGIC MẬT KHẨU CÓ ĐIỀU KIỆN
    // Chỉ mã hóa và thêm 'password' vào dataToUpdate
    // NẾU nó được gửi lên (không rỗng)
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }
    // Nếu 'password' là undefined (không gửi), nó sẽ tự động bị bỏ qua

    // 3. Cập nhật user
    const updatedStaff = await prisma.user.update({
      where: { id: staffId },
      data: dataToUpdate, 
      select: { 
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
        role: true,
        createdAt: true,
      }
    });

    res.status(200).json(updatedStaff);

  } catch (error) {
    if (error.code === 'P2002') { // Trùng email
      return res.status(409).json({ message: 'Email này đã được sử dụng.' });
    }
    if (error.code === 'P2025') { // Không tìm thấy
      return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// DELETE /api/staff/:id
router.delete('/:id', async (req, res) => {
  const staffId = parseInt(req.params.id);
  
  // if (staffId === req.user.userId) {
  //   return res.status(403).json({ message: 'Bạn không thể tự xóa chính mình.' });
  // }

  try {
    // (Cần xử lý ràng buộc: Xóa Refresh Token của họ trước)
    await prisma.userToken.deleteMany({
      where: { userId: staffId },
    });
    
    // (Cần xử lý ràng buộc: Gán các Order cũ cho Admin?)
    // Tạm thời, chúng ta sẽ xóa
    await prisma.user.delete({
      where: { id: staffId },
    });

    res.status(204).send(); // Xóa thành công
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });
    }
    // Lỗi ràng buộc (ví dụ: đang xử lý Order)
    if (error.code === 'P2003') {
       return res.status(409).json({ message: 'Không thể xóa nhân viên đang xử lý đơn hàng.' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});


export default router;