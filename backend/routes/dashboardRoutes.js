import express from 'express';
import { prisma } from '../index.js';

const router = express.Router();

// GET /api/dashboard/stats
// Lấy các thống kê cơ bản cho Dashboard
router.get('/stats', async (req, res) => {
  try {
    // 1. Xác định ngày hôm nay (00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 2. Tính doanh thu hôm nay (chỉ đơn đã PAID)
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        status: true,
        totalAmount: true,
      },
    });

    const todayRevenue = todayOrders
      .filter(order => order.status === 'PAID')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    const todayOrdersCount = todayOrders.length;

    // 3. Đếm số bàn đang phục vụ
    // Đếm dựa trên bàn có orders đang active (PENDING, COOKING, SERVED)
    // Thay vì dựa vào table.status vì có thể không được cập nhật tự động
    const tablesWithActiveOrders = await prisma.order.groupBy({
      by: ['tableId'],
      where: {
        status: {
          in: ['PENDING', 'COOKING', 'SERVED']
        }
      },
    });
    
    const occupiedTables = tablesWithActiveOrders.length;

    // 4. Tìm món ăn bán chạy nhất (dựa vào OrderDetail)
    // Cách 1: Sử dụng groupBy (nhanh hơn)
    const topItemData = await prisma.orderDetail.groupBy({
      by: ['menuItemId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 1,
    });

    let topItem = null;
    if (topItemData.length > 0) {
      const topItemId = topItemData[0].menuItemId;
      const totalSold = topItemData[0]._sum.quantity || 0;
      
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: topItemId },
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      });

      topItem = {
        ...menuItem,
        totalSold,
      };
    }

    // 5. Trả về kết quả
    res.status(200).json({
      todayRevenue,
      todayOrders: todayOrdersCount,
      occupiedTables,
      topItem,
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy thống kê dashboard', 
      error: error.message 
    });
  }
});

// GET /api/dashboard/revenue-chart
// Lấy dữ liệu doanh thu 7 ngày gần nhất
router.get('/revenue-chart', async (req, res) => {
  try {
    // 1. Xác định khoảng thời gian 7 ngày
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Cuối ngày hôm nay
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 2. Lấy tất cả orders trong 7 ngày với status PAID
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
          lte: today,
        },
        status: 'PAID',
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    // 3. Tạo map theo ngày
    const revenueMap = {};
    
    // Khởi tạo 7 ngày với revenue = 0
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      revenueMap[dateKey] = 0;
    }

    // Tính tổng revenue cho mỗi ngày
    orders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (revenueMap[dateKey] !== undefined) {
        revenueMap[dateKey] += order.totalAmount;
      }
    });

    // 4. Chuyển map thành array và format cho frontend
    const chartData = Object.entries(revenueMap).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    // Sắp xếp theo ngày tăng dần
    chartData.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json(chartData);

  } catch (error) {
    console.error('Revenue chart error:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy dữ liệu biểu đồ doanh thu', 
      error: error.message 
    });
  }
});

// GET /api/dashboard/active-orders
// Lấy danh sách orders đang xử lý (PENDING, COOKING, SERVED)
router.get('/active-orders', async (req, res) => {
  try {
    const { status, tableId, limit } = req.query;
    
    // Build where conditions
    const whereConditions = {
      status: {
        in: ['PENDING', 'COOKING', 'SERVED']
      }
    };
    
    // Filter theo status cụ thể nếu có
    if (status && ['PENDING', 'COOKING', 'SERVED'].includes(status)) {
      whereConditions.status = status;
    }
    
    // Filter theo bàn nếu có
    if (tableId) {
      whereConditions.tableId = parseInt(tableId);
    }
    
    // Fetch orders với full details
    const orders = await prisma.order.findMany({
      where: whereConditions,
      include: {
        table: {
          select: { name: true }
        },
        staff: {
          select: { id: true, name: true, avatarUrl: true }
        },
        details: {
          include: {
            menuItem: {
              select: { name: true, imageUrl: true, price: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit ? parseInt(limit) : 20 // Default 20 orders
    });
    
    res.status(200).json(orders);
    
  } catch (error) {
    console.error('Active orders error:', error);
    res.status(500).json({
      message: 'Lỗi khi lấy danh sách đơn hàng',
      error: error.message
    });
  }
});

export default router;
