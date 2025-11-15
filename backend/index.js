import express from 'express'; // Framework để tạo server
import cors from 'cors'; // Cho phép frontend gọi API
import dotenv from 'dotenv'; // Đọc file .env
import { PrismaClient } from '@prisma/client'; // Import Prisma
import authRoutes from './routes/authRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
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


app.use(cors()); // Cho phép mọi domain gọi API này (để test)

app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/orders', orderRoutes);

const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: "*", // (Cho phép mọi domain - có thể sửa lại sau)
    methods: ["GET", "POST"]
  }
});

// 5. 🧠 KHÁI NIỆM: "Rooms" (Phòng)
//    Chúng ta lắng nghe kết nối
io.on('connection', (socket) => {
  console.log(`Một người dùng đã kết nối: ${socket.id}`);
  
  // 5a. Khi Khách hàng (Frontend) "tham gia"
  socket.on('join_order_room', (orderId) => {
    // 5b. Cho socket này vào 1 "phòng" riêng
    //    (Ví dụ: "order_123")
    socket.join(`order_${orderId}`);
    console.log(`Socket ${socket.id} đã vào phòng order_${orderId}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`Người dùng đã ngắt kết nối: ${socket.id}`);
  });
});

// 6. Chạy httpServer (thay vì app)
httpServer.listen(port, () => {
  console.log(`Server (HTTP + Socket.IO) đang chạy tại http://localhost:${port}`);
});

// app.get('/', (req, res) => {
//   res.send('Chào mừng đến với API Nhà hàng!');
// });



// --- Khởi động Server ---
// app.listen(port, () => {
//   console.log(`Server đang chạy tại http://localhost:${port}`);
// });