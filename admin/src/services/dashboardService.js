import api from './api';

// Lấy thống kê dashboard
export const fetchDashboardStats = async () => {
  const response = await api.get('/api/dashboard/stats');
  return response.data;
};

// Lấy dữ liệu biểu đồ doanh thu 7 ngày
export const fetchRevenueChart = async () => {
  const response = await api.get('/api/dashboard/revenue-chart');
  return response.data;
};

const dashboardService = {
  fetchDashboardStats,
  fetchRevenueChart,
};

export default dashboardService;
