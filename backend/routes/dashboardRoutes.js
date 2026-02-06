import express from 'express';
import { prisma } from '../index.js';

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

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

    const tablesWithActiveOrders = await prisma.order.groupBy({
      by: ['tableId'],
      where: {
        status: {
          in: ['PENDING', 'COOKING', 'SERVED']
        }
      },
    });
    
    const occupiedTables = tablesWithActiveOrders.length;

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

    const revenueChangePercent = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100)
      : (todayRevenue > 0 ? 100 : 0);

    const ordersChangeDelta = todayOrdersCount - yesterdayOrdersCount;

    res.status(200).json({
      todayRevenue,
      todayOrders: todayOrdersCount,
      occupiedTables,
      topItem,
      yesterdayRevenue,
      yesterdayOrders: yesterdayOrdersCount,
      revenueChangePercent: Math.round(revenueChangePercent * 10) / 10,
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

router.get('/revenue-chart', async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    let startDate;
    let numDays;
    
    if (period === 'month') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      numDays = 30;
    } else {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      numDays = 7;
    }

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

    const revenueMap = {};
    
    for (let i = 0; i < numDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      revenueMap[dateKey] = 0;
    }

    orders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (revenueMap[dateKey] !== undefined) {
        revenueMap[dateKey] += order.totalAmount;
      }
    });

    const chartData = Object.entries(revenueMap).map(([date, revenue]) => ({
      date,
      revenue,
    }));

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

router.get('/active-orders', async (req, res) => {
  try {
    const { status, tableId, limit } = req.query;
    
    const whereConditions = {
      status: {
        in: ['PENDING', 'COOKING', 'SERVED']
      }
    };
    
    if (status && ['PENDING', 'COOKING', 'SERVED'].includes(status)) {
      whereConditions.status = status;
    }
    
    if (tableId) {
      whereConditions.tableId = parseInt(tableId);
    }
    
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
      take: limit ? parseInt(limit) : 20
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

router.get('/top-items', async (req, res) => {
  try {
    const { period = 'today', limit = 10 } = req.query;
    
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
