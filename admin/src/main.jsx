// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // File TailwindCSS
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';

// Import các Layout và Trang
import RootLayout from './layouts/RootLayout';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import ManageTablesPage from './pages/ManageTables';
// (Import các trang khác ở đây)

// TẠI SAO DÙNG createBrowserRouter?
// Đây là cách cấu hình router hiện đại nhất.
// Nó cho phép cấu hình "lồng nhau" (nested routes) rất trực quan.
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />, // Luôn render khung gốc
    // (Sau này thêm trang Error ở đây)
    children: [
      // 1. Tuyến đường cho Trang Đăng nhập
      // (Nằm ngoài AdminLayout vì nó không có Sidebar)
      {
        path: '/login',
        element: <LoginPage />,
      },
      
      // 2. Tuyến đường cho Admin (được bọc bởi AdminLayout)
      {
        path: '/', // Trang chủ của admin
        element: <AdminLayout />,
        children: [
          // Các trang con này sẽ được nhét vào <Outlet />
          {
            index: true, // Trang chủ (khi path là '/')
            element: <DashboardPage />,
          },
          {
            path: 'tables', // URL sẽ là /tables
            element: <ManageTablesPage />,
          },
          // {
          //   path: 'menu', // URL sẽ là /menu
          //   element: <ManageMenuPage />,
          // },
          // ... (thêm các trang quản lý khác ở đây)
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Cung cấp router cho toàn bộ ứng dụng */}
    <RouterProvider router={router} />
  </React.StrictMode>
);