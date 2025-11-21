import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * StatsCard - Component hiển thị một thẻ thống kê
 * @param {string} title - Tiêu đề card
 * @param {string|number} value - Giá trị hiển thị 
 * @param {React.Component} icon - Icon component từ lucide-react
 * @param {string} description - Mô tả bổ sung (optional)
 * @param {string} trend - 'up' | 'down' | 'neutral' | null
 * @param {string} comparisonText - Text so sánh (e.g., "+15% so với hôm qua")
 */
export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  trend,
  comparisonText 
}) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-muted-foreground';
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {comparisonText && (
          <div className={`flex items-center gap-1 text-xs font-medium mt-2 ${getTrendColor()}`}>
            {TrendIcon && <TrendIcon className="h-3 w-3" />}
            <span>{comparisonText}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
