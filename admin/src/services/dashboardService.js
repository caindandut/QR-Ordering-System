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

// Lấy danh sách orders đang xử lý
export const fetchActiveOrders = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await api.get(`/api/dashboard/active-orders?${params}`);
  return response.data;
};

// Quick actions cho orders (reuse admin order APIs)
export const approveOrder = async (orderId) => {
  const response = await api.patch(`/api/admin/orders/${orderId}/status`, { status: 'COOKING' });
  return response.data;
};

export const denyOrder = async (orderId) => {
  const response = await api.patch(`/api/admin/orders/${orderId}/status`, { status: 'DENIED' });
  return response.data;
};

export const markAsServed = async (orderId) => {
  const response = await api.patch(`/api/admin/orders/${orderId}/status`, { status: 'SERVED' });
  return response.data;
};

// Lấy danh sách món bán chạy
export const fetchTopItems = async (period = 'today', limit = 10) => {
  const response = await api.get('/api/dashboard/top-items', {
    params: { period, limit }
  });
  return response.data;
};

const dashboardService = {
  fetchDashboardStats,
  fetchRevenueChart,
  fetchActiveOrders,
  approveOrder,
  denyOrder,
  markAsServed,
  fetchTopItems,
};

export default dashboardService;

