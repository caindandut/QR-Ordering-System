import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * StatsCard - Component hiển thị một thẻ thống kê
 * @param {string} title - Tiêu đề card
 * @param {string|number} value - Giá trị hiển thị 
 * @param {React.Component} icon - Icon component từ lucide-react
 * @param {string} description - Mô tả bổ sung (optional)
 */
export default function StatsCard({ title, value, icon: Icon, description }) {
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
      </CardContent>
    </Card>
  );
}
