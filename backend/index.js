import express from 'express'; // Framework để tạo server
import cors from 'cors'; // Cho phép frontend gọi API
import dotenv from 'dotenv'; // Đọc file .env
import { PrismaClient } from '@prisma/client'; // Import Prisma
import authRoutes from './routes/authRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
// --- Khởi tạo ---
dotenv.config(); // Nạp các biến từ file .env
const app = express(); // Tạo app Express
const port = process.env.PORT || 8080; // Đặt cổng server

// TẠI SAO PHẢI KHỞI TẠO PRISMA Ở ĐÂY?
// Tác dụng: Chúng ta tạo 1 "instance" (phiên bản) duy nhất của PrismaClient
// và tái sử dụng nó cho toàn bộ ứng dụng.
// Nếu bạn tạo `new PrismaClient()` bên trong mỗi API, bạn sẽ
// nhanh chóng làm cạn kiệt kết nối database và sập server.
export const prisma = new PrismaClient();

// --- Cấu hình Middleware (Phần mềm trung gian) ---
app.use(cors()); // Cho phép mọi domain gọi API này (để test)

// TẠI SAO DÙNG express.json()?
// Tác dụng: Nó "dịch" các request có body là JSON (thường từ React gửi lên)
// để chúng ta có thể đọc được trong `req.body`
app.use(express.json());

// TẠI SAO DÙNG /api/auth?
// Tác dụng: Đây là "tiền tố" (prefix). Mọi API trong file authRoutes
// sẽ bắt đầu bằng /api/auth.
// Ví dụ: /register sẽ trở thành /api/auth/register
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);

// --- API Test (Health Check) ---
// Giúp kiểm tra xem server có "sống" hay không
app.get('/', (req, res) => {
  res.send('Chào mừng đến với API Nhà hàng!');
});

// --- TODO: Import các API Routes (sẽ làm ở bước 3) ---

// --- Khởi động Server ---
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});