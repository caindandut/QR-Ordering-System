// middleware/uploadMiddleware.js
import multer from 'multer';

// TẠI SAO DÙNG memoryStorage()?
// Tác dụng: Multer sẽ giữ file trong RAM (dưới dạng Buffer)
// thay vì lưu nó vào ổ cứng của server.
// Điều này nhanh hơn và an toàn hơn, vì chúng ta chỉ
// cần chuyển tiếp nó lên Cloudinary rồi quên nó đi.
const storage = multer.memoryStorage();

// Khởi tạo multer với cấu hình lưu trữ
const upload = multer({ storage: storage });

export default upload;