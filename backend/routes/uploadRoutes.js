// routes/uploadRoutes.js
import express from 'express';
import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary.js'; // Import cấu hình cloudinary
import upload from '../middleware/uploadMiddleware.js'; // Import middleware multer
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// TẠI SAO DÙNG upload.single('image')?
// 1. `upload.single(...)`: Đây là middleware của Multer.
//    Nó "bắt" 1 file duy nhất từ request.
// 2. `('image')`: Đây là "tên trường" (field name) mà
//    Frontend (React) PHẢI dùng khi gửi file.
//    (vd: formData.append('image', fileObject))

// API này sẽ được bảo vệ, chỉ ai đăng nhập mới được upload
router.post(
  '/',
  authenticateToken,
  upload.single('image'),
  async (req, res) => {

    // 1. Kiểm tra xem có file không
    if (!req.file) {
      return res.status(400).json({ message: 'Không tìm thấy file nào.' });
    }

    // 2. Tạo một stream để upload lên Cloudinary
    // Tác dụng: 'upload_stream' cho phép chúng ta "đẩy" dữ liệu
    // lên Cloudinary mà không cần tạo file tạm.
    const cld_upload_stream = cloudinary.uploader.upload_stream(
      {
        folder: 'restaurant-project', // Tên thư mục trên Cloudinary
        // (Bạn có thể thêm các tùy chọn khác như transformation)
      },
      (error, result) => {
        // 3. Callback này được gọi khi upload xong
        if (error) {
          return res.status(500).json({
            message: 'Lỗi khi upload ảnh lên Cloudinary',
            error: error.message,
          });
        }

        // 4. Upload thành công! Trả về URL
        // `result.secure_url` là URL an toàn (https)
        // mà Cloudinary cung cấp
        res.status(200).json({
          message: 'Upload ảnh thành công',
          imageUrl: result.secure_url,
        });
      }
    );

    // TÁC DỤNG CỦA DÒNG NÀY:
    // Lấy file từ RAM (req.file.buffer)
    // Dùng streamifier để biến nó thành 1 dòng chảy (stream)
    // Và "bơm" (pipe) nó vào stream upload của Cloudinary.
    streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);

  }
);

export default router;