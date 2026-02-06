import express from 'express';
import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary.js';
import upload from '../middleware/uploadMiddleware.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/',
  authenticateToken,
  upload.single('image'),
  async (req, res) => {

    if (!req.file) {
      return res.status(400).json({ message: 'Không tìm thấy file nào.' });
    }

    const cld_upload_stream = cloudinary.uploader.upload_stream(
      {
        folder: 'restaurant-project',
      },
      (error, result) => {
        if (error) {
          return res.status(500).json({
            message: 'Lỗi khi upload ảnh lên Cloudinary',
            error: error.message,
          });
        }

        res.status(200).json({
          message: 'Upload ảnh thành công',
          imageUrl: result.secure_url,
        });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);

  }
);

export default router;
