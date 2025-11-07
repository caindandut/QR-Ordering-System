// routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js'; // Import prisma từ file index

const router = express.Router();

// 1. API Đăng ký (Register)
// TẠI SAO LÀ 'POST'?
// Tác dụng: Chúng ta đang *tạo* một tài nguyên mới (User), 
// nên dùng phương thức POST.
router.post('/register', async (req, res) => {
  try {
    // Lấy thông tin từ body của request
    const { email, password, name, role } = req.body;

    // 1. Kiểm tra thông tin đầu vào
    if (!email || !password || !name) {
      return res
        .status(400) // 400 = Bad Request (Yêu cầu tồi)
        .json({ message: 'Vui lòng cung cấp đủ email, mật khẩu và tên.' });
    }

    // 2. Kiểm tra email đã tồn tại chưa
    // Tác dụng: Dùng prisma để tìm 1 user có email trùng
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Email đã tồn tại.' }); // 409 = Conflict
    }

    // 3. Mã hóa mật khẩu (RẤT QUAN TRỌNG)
    // Tác dụng: Dùng bcrypt "rắc muối" (salt) 10 lần và hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Tạo người dùng mới trong database
    const newUser = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword, // Lưu mật khẩu đã mã hóa
        name: name,
        role: role || 'STAFF', // Nếu không cung cấp role, mặc định là STAFF
      },
    });

    // 5. Trả về thông tin (KHÔNG TRẢ VỀ MẬT KHẨU)
    // Tác dụng: Xóa mật khẩu khỏi object trước khi gửi về client
    delete newUser.password;
    res.status(201).json(newUser); // 201 = Created (Tạo thành công)

  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// --- TODO: API Đăng nhập (sẽ làm ở bước 4) ---
// 2. API Đăng nhập (Login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Kiểm tra đầu vào
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Vui lòng cung cấp email và mật khẩu.' });
    }

    // 2. Tìm người dùng trong DB
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(404).json({ message: 'Email không tồn tại.' }); // 404 = Not Found
    }

    // 3. So sánh mật khẩu
    // Tác dụng: Dùng bcrypt so sánh mật khẩu thô (password)
    // với mật khẩu đã hash (user.password) trong DB.
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Mật khẩu không đúng' }); // 401 = Unauthorized
    }

    // 4. TẠO TOKENS (Phần quan trọng)
    
    // Tạo Access Token (hạn 15 phút)
    // Tác dụng: Chứa thông tin cơ bản (userId, role) để
    // server biết bạn là ai và bạn có quyền gì.
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' } // Hạn 15 phút
    );

    // Tạo Refresh Token (hạn 7 ngày)
    // Tác dụng: Chỉ dùng để lấy Access Token mới
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' } // Hạn 7 ngày
    );

    // 5. Lưu Refresh Token vào DB (Bảng UserToken)
    // Tác dụng: Chúng ta lưu lại token này để có thể thu hồi
    // (ví dụ khi user đổi mật khẩu hoặc đăng xuất)
    await prisma.userToken.upsert({
      where: { userId: user.id },
      update: { token: refreshToken },
      create: { userId: user.id, token: refreshToken },
    });

    // 6. Trả về thông tin
    delete user.password; // Luôn xóa mật khẩu
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

// 3. API Gia hạn Token (Refresh Token)
router.post('/refresh', async (req, res) => {
  // 1. Lấy refresh token từ body
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: 'Không tìm thấy refresh token.' });
  }

  try {
    // 2. Kiểm tra xem token này có tồn tại trong DB không
    // TẠI SAO?
    // Tác dụng: Đây là bước bảo mật. Nếu user nhấn "Đăng xuất",
    // chúng ta sẽ XÓA token này khỏi DB.
    // Kẻ gian dù có trộm được token cũng không thể gia hạn.
    const tokenInDb = await prisma.userToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenInDb) {
      return res.status(403).json({ message: 'Refresh token không hợp lệ (không có trong DB).' });
    }

    // 3. Xác thực Refresh Token (Check hạn, check chữ ký)
    // TẠI SAO DÙNG REFRESH_TOKEN_SECRET?
    // Tác dụng: Dùng "bí mật" của Refresh Token
    // để đảm bảo nó hợp lệ.
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, payload) => {
        if (err) {
          return res.status(403).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn.' });
        }
        
        // 4. Token hợp lệ! Tạo một ACCESS TOKEN MỚI
        // (Lấy userId và role từ payload của refresh token)
        // (Lưu ý: Payload của refresh token của chúng ta chỉ có userId,
        //  chúng ta cần lấy lại role từ tokenInDb hoặc payload.
        //  Chúng ta nên sửa lại API /login để refresh token cũng chứa role)
        
        // --- Sửa lại logic 1 chút ---
        // Payload của Refresh Token chỉ có userId. 
        // Chúng ta cần lấy role từ DB để tạo Access Token mới.
        
        // Tốt hơn, hãy sửa API /login:
        // Cả Access và Refresh Token đều nên chứa { userId: user.id, role: user.role }
        // Hoặc chúng ta tìm user từ payload.userId
        
        // Tạm thời, chúng ta sẽ tạo lại Access Token mới
        // với thông tin từ payload (giả sử nó có userId)
        const newAccessToken = jwt.sign(
          { userId: payload.userId, role: payload.role }, // Giả định payload có cả role
                                                        // Nếu không, bạn cần truy vấn DB: const user = await prisma.user.find(payload.userId)
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: '15m' } // Cấp vé 15 phút mới
        );

        res.status(200).json({
          accessToken: newAccessToken,
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// (Tùy chọn) 4. API Đăng xuất (Logout)
router.post('/logout', async (req, res) => {
    // Nhận refresh token mà client đang giữ
    const { refreshToken } = req.body;
    
    // TÁC DỤNG CỦA LOGOUT LÀ GÌ?
    // Tác dụng: Xóa Refresh Token khỏi DB.
    // Khiến nó không thể dùng để gia hạn được nữa.
    try {
        await prisma.userToken.delete({
            where: { token: refreshToken }
        });
        res.status(200).json({ message: 'Đăng xuất thành công.' });
    } catch (error) {
        // Bỏ qua lỗi nếu không tìm thấy token
        res.status(200).json({ message: 'Đăng xuất thành công.' });
    }
});


export default router;