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
          name_jp: true,
          imageUrl: true,
        },
      });

      topItem = {
        ...menuItem,
        totalSold,
      };
    }

    // 5. Tính dữ liệu hôm qua để so sánh
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
      select: {
        status: true,
        totalAmount: true,
      },
    });

    const yesterdayRevenue = yesterdayOrders
      .filter(order => order.status === 'PAID')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    const yesterdayOrdersCount = yesterdayOrders.length;

    // 6. Tính % thay đổi
    const revenueChangePercent = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100)
      : (todayRevenue > 0 ? 100 : 0);

    const ordersChangeDelta = todayOrdersCount - yesterdayOrdersCount;

    // 7. Trả về kết quả
    res.status(200).json({
      todayRevenue,
      todayOrders: todayOrdersCount,
      occupiedTables,
      topItem,
      yesterdayRevenue,
      yesterdayOrders: yesterdayOrdersCount,
      revenueChangePercent: Math.round(revenueChangePercent * 10) / 10, // Round to 1 decimal
      ordersChangeDelta,
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
// Lấy dữ liệu doanh thu theo khoảng thời gian
router.get('/revenue-chart', async (req, res) => {
  try {
    const { period = 'week' } = req.query; // 'week' hoặc 'month'
    
    // 1. Xác định khoảng thời gian
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Cuối ngày hôm nay
    
    let startDate;
    let numDays;
    
    if (period === 'month') {
      // Lấy 30 ngày gần nhất
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      numDays = 30;
    } else {
      // Mặc định: 7 ngày (tuần)
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      numDays = 7;
    }

    // 2. Lấy tất cả orders trong khoảng thời gian với status PAID
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
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
    
    // Khởi tạo các ngày với revenue = 0
    for (let i = 0; i < numDays; i++) {
      const date = new Date(startDate);
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

// GET /api/dashboard/top-items
// Lấy danh sách món ăn bán chạy nhất
router.get('/top-items', async (req, res) => {
  try {
    const { period = 'today', limit = 10 } = req.query;
    
    // 1. Xác định khoảng thời gian
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
    }
    
    // 2. Lấy tất cả OrderDetails trong khoảng thời gian
    // Chỉ tính các orders đã PAID
    const orderDetails = await prisma.orderDetail.findMany({
      where: {
        order: {
          status: 'PAID',
          createdAt: {
            gte: startDate,
          },
        },
      },
      include: {
        menuItem: {
          select: {
            id: true,
            name: true,
            name_jp: true,
            imageUrl: true,
            category: {
              select: {
                name: true,
                name_jp: true,
              },
            },
          },
        },
      },
    });
    
    // 3. Group by menuItemId và tính toán
    const itemsMap = {};
    
    orderDetails.forEach(detail => {
      const itemId = detail.menuItemId;
      
      if (!itemsMap[itemId]) {
        itemsMap[itemId] = {
          menuItemId: itemId,
          name: detail.menuItem.name,
          name_jp: detail.menuItem.name_jp,
          imageUrl: detail.menuItem.imageUrl,
          category: detail.menuItem.category?.name || 'Khác',
          category_jp: detail.menuItem.category?.name_jp || detail.menuItem.category?.name || 'Khác',
          quantitySold: 0,
          revenue: 0,
        };
      }
      
      itemsMap[itemId].quantitySold += detail.quantity;
      itemsMap[itemId].revenue += detail.priceAtOrder * detail.quantity;
    });
    
    // 4. Chuyển thành array và sắp xếp
    const topItems = Object.values(itemsMap)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, parseInt(limit));
    
    res.status(200).json(topItems);
    
  } catch (error) {
    console.error('Top items error:', error);
    res.status(500).json({
      message: 'Lỗi khi lấy danh sách món bán chạy',
      error: error.message
    });
  }
});

// GET /api/dashboard/tables
// Lấy danh sách tất cả bàn với trạng thái và order hiện tại
router.get('/tables', async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { id: 'asc' },
    });

    const tablesWithStatus = await Promise.all(
      tables.map(async (table) => {
        const activeOrder = await prisma.order.findFirst({
          where: {
            tableId: table.id,
            status: { in: ['PENDING', 'COOKING', 'SERVED'] },
          },
          include: {
            details: {
              include: {
                menuItem: {
                  select: { name: true, imageUrl: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        let status = table.status;
        if (activeOrder && status !== 'HIDDEN') {
          status = 'OCCUPIED';
        } else if (!activeOrder && status !== 'HIDDEN') {
          status = 'AVAILABLE';
        }

        let currentOrder = null;
        if (activeOrder) {
          currentOrder = {
            id: activeOrder.id,
            customerName: activeOrder.customerName,
            totalAmount: activeOrder.totalAmount,
            status: activeOrder.status,
            createdAt: activeOrder.createdAt,
            details: activeOrder.details.map(detail => ({
              menuItemName: detail.menuItem.name,
              menuItemImage: detail.menuItem.imageUrl,
              quantity: detail.quantity,
              priceAtOrder: detail.priceAtOrder,
              subtotal: detail.quantity * detail.priceAtOrder,
            })),
          };
        }

        return {
          id: table.id,
          name: table.name,
          capacity: table.capacity,
          status,
          currentOrder,
        };
      })
    );

    res.status(200).json(tablesWithStatus);
  } catch (error) {
    console.error('Tables fetch error:', error);
    res.status(500).json({
      message: 'Lỗi khi lấy danh sách bàn',
      error: error.message,
    });
  }
});

export default router;
