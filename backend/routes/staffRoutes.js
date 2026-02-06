import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index.js';
import { authenticateToken, authorizeAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeAdmin);

router.get('/', async (req, res) => {
  try {
    const staffList = await prisma.user.findMany({
      orderBy: { id: 'asc' },
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

router.post('/', async (req, res) => {
  const { name, email, password, phone, role, avatarUrl } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Tên, email, mật khẩu và vai trò là bắt buộc.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role,
        avatarUrl,
      },
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
    
    res.status(201).json(newStaff);

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Email này đã được sử dụng.' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});


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

    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

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
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Email này đã được sử dụng.' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const staffId = parseInt(req.params.id);

  try {
    await prisma.userToken.deleteMany({
      where: { userId: staffId },
    });
    
    await prisma.user.delete({
      where: { id: staffId },
    });

    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Không tìm thấy nhân viên.' });
    }
    if (error.code === 'P2003') {
       return res.status(409).json({ message: 'Không thể xóa nhân viên đang xử lý đơn hàng.' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});


export default router;
