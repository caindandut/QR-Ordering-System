import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

/**
 * RevenueChart - Component hiển thị biểu đồ doanh thu với filter thời gian
 * @param {Array} data - Mảng dữ liệu [{date: 'YYYY-MM-DD', revenue: number}]
 * @param {string} period - Khoảng thời gian hiện tại ('week' hoặc 'month')
 * @param {Function} onPeriodChange - Callback khi thay đổi period
 */
export default function RevenueChart({ data, period = 'week', onPeriodChange }) {
  const { t, i18n } = useTranslation();
  
  const periodLabels = {
    week: t('dashboard.revenue_chart.week'),
    month: t('dashboard.revenue_chart.month'),
  };

  // Không render nếu không có dữ liệu
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('dashboard.revenue_chart.title')}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {periodLabels[period]}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onPeriodChange('week')}>
                  {t('dashboard.revenue_chart.week')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPeriodChange('month')}>
                  {t('dashboard.revenue_chart.month')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center py-8">
            {t('dashboard.revenue_chart.no_data')}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format dữ liệu cho biểu đồ
  const chartData = data.map((item) => ({
    name: format(new Date(item.date), 'dd/MM'), // Hiển thị ngắn gọn: 20/11
    doanhThu: item.revenue, // Đổi key sang tiếng Việt
    fullDate: item.date, // Giữ lại cho tooltip
  }));

  // Custom formatter cho tooltip
  const formatTooltip = (value) => {
    return `${value.toLocaleString('vi-VN')}đ`;
  };

  // Custom formatter cho trục Y (hiển thị triệu đồng)
  const formatYAxis = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}tr`;
    }
    return `${(value / 1000)}k`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('dashboard.revenue_chart.title')}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {periodLabels[period]}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPeriodChange('week')}>
                {t('dashboard.revenue_chart.week')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPeriodChange('month')}>
                {t('dashboard.revenue_chart.month')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                tickFormatter={formatYAxis}
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                formatter={formatTooltip}
                labelFormatter={(label) => t('dashboard.revenue_chart.tooltip_date', { date: label })}
              />
              <Line 
                type="monotone" 
                dataKey="doanhThu"
                name={t('dashboard.revenue_chart.tooltip_revenue')}
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
