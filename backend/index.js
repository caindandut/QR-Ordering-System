import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminOrderRoutes from './routes/adminOrderRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();
const app = express();
const port = process.env.PORT || 8080;

export const prisma = new PrismaClient();


app.use(cors());

app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'QR Ordering System API is running',
    timestamp: new Date().toISOString()
  });
});

const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`Một người dùng đã kết nối: ${socket.id}`);
  
  socket.on('join_order_room', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`Socket ${socket.id} đã vào phòng order_${orderId}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`Người dùng đã ngắt kết nối: ${socket.id}`);
  });
});

httpServer.listen(port, () => {
  console.log(`Server (HTTP + Socket.IO) đang chạy tại http://localhost:${port}`);
});
