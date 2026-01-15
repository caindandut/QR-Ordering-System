import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StatsCard from '@/components/dashboard/StatsCard';
import StatsCardSkeleton from '@/components/dashboard/StatsCardSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import RevenueChart from '@/components/dashboard/RevenueChart';
import ActiveOrdersList from '@/components/dashboard/ActiveOrdersList';
import TopItemsTable from '@/components/dashboard/TopItemsTable';
import TableMap from '@/components/dashboard/TableMap';
import dashboardService from '@/services/dashboardService';
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
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
    } catch {
      toast({
        title: t('dashboard.error_title'),
        description: t('dashboard.error_load_data'),
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const revenueData = await dashboardService.fetchRevenueChart(revenuePeriod);
      setChartData(revenueData);
    } catch {
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
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-48" />
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>

        <Skeleton className="h-80 w-full" />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>

        <div className="mt-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const revenueTrend = getTrend(stats.todayRevenue, stats.yesterdayRevenue);
  const ordersTrend = getTrend(stats.todayOrders, stats.yesterdayOrders);

  const revenueComparison = stats.revenueChangePercent !== undefined 
    ? t('dashboard.revenue_comparison', { percent: formatPercentage(stats.revenueChangePercent) })
    : '';
  const ordersComparison = stats.ordersChangeDelta !== undefined 
    ? t('dashboard.orders_comparison', { delta: formatDelta(stats.ordersChangeDelta) })
    : '';

  return (
    <div className="flex flex-col gap-3 sm:gap-4 animate-in fade-in duration-500">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
      
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t('dashboard.today_revenue')}
          value={formatCurrency(stats.todayRevenue)}
          icon={DollarSign}
          description={t('dashboard.today_revenue_desc')}
          trend={revenueTrend}
          comparisonText={revenueComparison}
        />
        
        <StatsCard
          title={t('dashboard.today_orders')}
          value={stats.todayOrders}
          icon={ShoppingCart}
          description={t('dashboard.today_orders_desc')}
          trend={ordersTrend}
          comparisonText={ordersComparison}
        />
        
        <StatsCard
          title={t('dashboard.occupied_tables')}
          value={stats.occupiedTables}
          icon={Users}
          description={t('dashboard.occupied_tables_desc')}
        />
        
        <StatsCard
          title={t('dashboard.top_item')}
          value={stats.topItem ? (i18n.language === 'jp' ? (stats.topItem.name_jp || stats.topItem.name) : stats.topItem.name) : t('dashboard.no_data')}
          icon={TrendingUp}
          description={stats.topItem ? t('dashboard.top_item_sold', { count: stats.topItem.totalSold }) : ''}
        />
      </div>

      <RevenueChart 
        data={chartData} 
        period={revenuePeriod}
        onPeriodChange={handlePeriodChange}
      />
      
      <div className="mt-4 sm:mt-6 lg:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <ActiveOrdersList />
        <TopItemsTable />
      </div>

      <div className="mt-4 sm:mt-6 lg:mt-8">
        <TableMap />
      </div>
    </div>
  );
}