import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();


router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: 'Vui lòng cung cấp đủ email, mật khẩu và tên.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Email đã tồn tại.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        name: name,
        role: role || 'STAFF',
      },
    });

    delete newUser.password;
    res.status(201).json(newUser);

  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Vui lòng cung cấp email và mật khẩu.', code: 'MISSING_CREDENTIALS' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(404).json({ message: 'Email không tồn tại.', code: 'EMAIL_NOT_FOUND' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Mật khẩu không đúng', code: 'INVALID_PASSWORD' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    await prisma.userToken.upsert({
      where: { userId: user.id },
      update: { token: refreshToken },
      create: { userId: user.id, token: refreshToken },
    });

    delete user.password;
    res.status(200).json({
      message: 'Đăng nhập thành công',
      user: user,
      accessToken: accessToken,
      refreshToken: refreshToken,
    });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: 'Không tìm thấy refresh token.' });
  }

  try {
    const tokenInDb = await prisma.userToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenInDb) {
      return res.status(403).json({ message: 'Refresh token không hợp lệ (không có trong DB).' });
    }

    const payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return res.status(403).json({ message: 'Người dùng không tồn tại.' });
    }

    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    res.status(200).json({
      accessToken: newAccessToken,
    });
    
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn.' });
    }
    
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;
    
    try {
        await prisma.userToken.delete({
            where: { token: refreshToken }
        });
        res.status(200).json({ message: 'Đăng xuất thành công.' });
    } catch (error) {
        res.status(200).json({ message: 'Đăng xuất thành công.' });
    }
});

router.use(authenticateToken); 

router.get('/me', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
        role: true,
      }
    });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng." });
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.patch('/me', async (req, res) => {
  const { name, phone, avatarUrl } = req.body;
  
  try {
    const dataToUpdate = { name, phone, avatarUrl };
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
        role: true,
      }
    });
    
    res.status(200).json({ user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.post('/change-password', async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.userId;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Vui lòng nhập đủ mật khẩu cũ và mới.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordCorrect) {
      return res.status(401).json({ message: 'Mật khẩu cũ không chính xác.' });
    }
    
    const isNewPasswordSameAsOld = await bcrypt.compare(newPassword, user.password);
    if (isNewPasswordSameAsOld) {
      return res.status(400).json({ message: 'Mật khẩu mới không được trùng với mật khẩu cũ.' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    res.status(200).json({ message: 'Đổi mật khẩu thành công.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});


export default router;
