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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { format } from 'date-fns';
import { vi, ja } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

export default function RevenueChart({ data, period = 'week', onPeriodChange }) {
  const { t, i18n } = useTranslation();
  
  const periodLabels = {
    week: t('dashboard.revenue_chart.week'),
    month: t('dashboard.revenue_chart.month'),
  };

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

  const locale = i18n.language === 'jp' ? ja : vi;
  const chartData = data.map((item) => ({
    name: format(new Date(item.date), 'dd/MM'),
    doanhThu: item.revenue,
    fullDate: item.date,
    dateObj: new Date(item.date),
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const formattedDate = format(data.dateObj, 'EEEE, dd MMMM yyyy', { locale });
      const revenue = payload[0].value;
      
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-foreground mb-1">
            {formattedDate}
          </p>
          <p className="text-base font-bold text-primary">
            {t('dashboard.revenue_chart.tooltip_revenue')}: {revenue.toLocaleString('vi-VN')}đ
          </p>
        </div>
      );
    }
    return null;
  };

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
      <CardContent className="p-2 sm:p-6">
        <div className="w-full h-[250px] sm:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={formatYAxis}
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="doanhThu"
                stroke="#8884d8"
                strokeWidth={3}
                fill="url(#colorRevenue)"
                dot={{ fill: '#8884d8', r: 4, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff', fill: '#8884d8' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
