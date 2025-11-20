import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

/**
 * RevenueChart - Component hiển thị biểu đồ doanh thu 7 ngày
 * @param {Array} data - Mảng dữ liệu [{date: 'YYYY-MM-DD', revenue: number}]
 */
export default function RevenueChart({ data }) {
  // Không render nếu không có dữ liệu
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Doanh thu 7 ngày qua</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center py-8">
            Không có dữ liệu
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
        <CardTitle>Doanh thu 7 ngày qua</CardTitle>
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
                labelFormatter={(label) => `Ngày ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="doanhThu"
                name="Doanh thu"
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
