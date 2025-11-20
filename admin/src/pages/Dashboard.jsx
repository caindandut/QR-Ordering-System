import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StatsCard from '@/components/dashboard/StatsCard';
import RevenueChart from '@/components/dashboard/RevenueChart';
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

  // Fetch dữ liệu khi component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Gọi song song 2 API
      const [statsData, revenueData] = await Promise.all([
        dashboardService.fetchDashboardStats(),
        dashboardService.fetchRevenueChart(),
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
      <RevenueChart data={chartData} />
    </div>
  );
}