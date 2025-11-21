import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StatsCard from '@/components/dashboard/StatsCard';
import RevenueChart from '@/components/dashboard/RevenueChart';
import ActiveOrdersList from '@/components/dashboard/ActiveOrdersList';
import TopItemsTable from '@/components/dashboard/TopItemsTable';
import TableMap from '@/components/dashboard/TableMap';
import dashboardService from '@/services/dashboardService';
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    occupiedTables: 0,
    topItem: null,
    yesterdayRevenue: 0,
    yesterdayOrders: 0,
    revenueChangePercent: 0,
    ordersChangeDelta: 0,
  });
  
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revenuePeriod, setRevenuePeriod] = useState('week');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchRevenueData();
  }, [revenuePeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, revenueData] = await Promise.all([
        dashboardService.fetchDashboardStats(),
        dashboardService.fetchRevenueChart(revenuePeriod),
      ]);

      setStats(statsData);
      setChartData(revenueData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu dashboard. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const revenueData = await dashboardService.fetchRevenueChart(revenuePeriod);
      setChartData(revenueData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
  };

  const handlePeriodChange = (newPeriod) => {
    setRevenuePeriod(newPeriod);
  };

  const formatCurrency = (amount) => {
    return `${amount.toLocaleString('vi-VN')}đ`;
  };

  const getTrend = (current, previous) => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
  };

  const formatPercentage = (percent) => {
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent}%`;
  };

  const formatDelta = (delta) => {
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Đang tải dữ liệu...</div>
      </div>
    );
  }

  // Tính trend và comparison text
  const revenueTrend = getTrend(stats.todayRevenue, stats.yesterdayRevenue);
  const ordersTrend = getTrend(stats.todayOrders, stats.yesterdayOrders);

  const revenueComparison = stats.revenueChangePercent !== undefined 
    ? `${formatPercentage(stats.revenueChangePercent)} so với hôm qua`
    : '';
  const ordersComparison = stats.ordersChangeDelta !== undefined 
    ? `${formatDelta(stats.ordersChangeDelta)} đơn`
    : '';

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Doanh thu hôm nay"
          value={formatCurrency(stats.todayRevenue)}
          icon={DollarSign}
          description="Tổng từ các đơn đã thanh toán"
          trend={revenueTrend}
          comparisonText={revenueComparison}
        />
        
        <StatsCard
          title="Đơn hàng hôm nay"
          value={stats.todayOrders}
          icon={ShoppingCart}
          description="Tất cả đơn hàng trong ngày"
          trend={ordersTrend}
          comparisonText={ordersComparison}
        />
        
        <StatsCard
          title="Bàn đang phục vụ"
          value={stats.occupiedTables}
          icon={Users}
          description="Số bàn hiện có khách"
        />
        
        <StatsCard
          title="Món bán chạy"
          value={stats.topItem?.name || 'Chưa có dữ liệu'}
          icon={TrendingUp}
          description={stats.topItem ? `Đã bán ${stats.topItem.totalSold} phần` : ''}
        />
      </div>

      <RevenueChart 
        data={chartData} 
        period={revenuePeriod}
        onPeriodChange={handlePeriodChange}
      />
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActiveOrdersList />
        <TopItemsTable />
      </div>

      <div className="mt-8">
        <TableMap />
      </div>
    </div>
  );
}