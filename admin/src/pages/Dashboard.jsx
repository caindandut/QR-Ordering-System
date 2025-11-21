import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StatsCard from '@/components/dashboard/StatsCard';
import RevenueChart from '@/components/dashboard/RevenueChart';
import ActiveOrdersList from '@/components/dashboard/ActiveOrdersList';
import TopItemsTable from '@/components/dashboard/TopItemsTable';
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
  });
  
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revenuePeriod, setRevenuePeriod] = useState('week'); // 'week' hoặc 'month'

  // Fetch dữ liệu khi component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch lại revenue chart khi period thay đổi
  useEffect(() => {
    fetchRevenueData();
  }, [revenuePeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Gọi song song 2 API
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

  // Format số tiền VNĐ
  const formatCurrency = (amount) => {
    return `${amount.toLocaleString('vi-VN')}đ`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
      
      {/* 1. Khu vực Thẻ Thống kê */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Doanh thu hôm nay"
          value={formatCurrency(stats.todayRevenue)}
          icon={DollarSign}
          description="Tổng từ các đơn đã thanh toán"
        />
        
        <StatsCard
          title="Đơn hàng hôm nay"
          value={stats.todayOrders}
          icon={ShoppingCart}
          description="Tất cả đơn hàng trong ngày"
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

      {/* 2. Khu vực Biểu đồ */}
      <RevenueChart 
        data={chartData} 
        period={revenuePeriod}
        onPeriodChange={handlePeriodChange}
      />
      
      {/* 3. Khu vực Đơn hàng đang xử lý & Top Items - Side by side trên desktop, Stack trên mobile */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActiveOrdersList />
        <TopItemsTable />
      </div>
    </div>
  );
}