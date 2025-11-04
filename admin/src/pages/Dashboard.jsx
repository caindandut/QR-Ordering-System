// src/pages/Dashboard.jsx

// Dùng `export default function` thay vì `export const`
export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Trang Dashboard</h1>
      <p className="text-gray-600">Chào mừng bạn đến với khu vực quản trị!</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Tổng số bàn</h3>
          <p className="text-3xl font-bold text-primary">0</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Đơn hàng hôm nay</h3>
          <p className="text-3xl font-bold text-primary">0</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Doanh thu</h3>
          <p className="text-3xl font-bold text-primary">0đ</p>
        </div>
      </div>
    </div>
  );
}

