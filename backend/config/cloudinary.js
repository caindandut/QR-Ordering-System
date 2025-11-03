// config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// TÁC DỤNG:
// File này đọc 3 biến môi trường từ .env
// và cấu hình "phiên làm việc" với Cloudinary.
// Nó sẵn sàng để được sử dụng ở bất kỳ đâu.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;