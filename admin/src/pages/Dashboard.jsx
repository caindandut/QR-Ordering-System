// src/pages/Dashboard.jsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, Package } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// --- BƯỚC QUAN TRỌNG: TẠO DỮ LIỆU GIẢ (MOCK DATA) ---
// (Sau này, chúng ta sẽ fetch dữ liệu này từ API)
const statsData = {
  revenue: 12500000,
  orders: 150,
  avgOrderValue: 83333,
};

const chartData = [
  { name: 'T2', DoanhThu: 1200000 },
  { name: 'T3', DoanhThu: 2100000 },
  { name: 'T4', DoanhThu: 1800000 },
  { name: 'T5', DoanhThu: 3500000 },
  { name: 'T6', DoanhThu: 2500000 },
  { name: 'T7', DoanhThu: 4200000 },
  { name: 'CN', DoanhThu: 3800000 },
];
// ----------------------------------------------------

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* 1. Khu vực Thẻ Thống kê */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData.revenue.toLocaleString('vi-VN')}đ
            </div>
            <p className="text-xs text-muted-foreground">+20.1% so với tháng trước</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đơn hàng</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{statsData.orders}</div>
            <p className="text-xs text-muted-foreground">+18.1% so với tháng trước</p>
          </CardContent>
        </Card>
        
        {/* (Bạn có thể thêm Card "Giá trị trung bình" ở đây) */}
      </div>

      {/* 2. Khu vực Biểu đồ */}
      <Card>
        <CardHeader>
          <CardTitle>Doanh thu 7 ngày qua</CardTitle>
        </CardHeader>
        <CardContent>
          {/* TẠI SAO DÙNG ResponsiveContainer?
            Tác dụng: Biểu đồ sẽ tự động co giãn 100% 
            theo kích thước của Card (cha) chứa nó.
          */}
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000000)}tr`} 
                />
                <Tooltip 
                  formatter={(value) => `${value.toLocaleString('vi-VN')}đ`}
                />
                <Line type="monotone" dataKey="DoanhThu" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}