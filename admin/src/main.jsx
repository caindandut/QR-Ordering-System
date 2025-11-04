// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
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

// 👇 1. Import "Trạm gác" của chúng ta
import { ProtectedRoute } from './components/ProtectedRoute'; 

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // 1. Tuyến đường cho Trang Đăng nhập (Công khai)
      {
        path: '/login',
        element: <LoginPage />,
      },
      
      // 2. Tuyến đường cho Admin (Bảo vệ)
      {
        // 2a. ĐẶT "TRẠM GÁC" Ở ĐÂY
        // Thay vì trỏ thẳng đến AdminLayout,
        // chúng ta trỏ đến ProtectedRoute
        element: <ProtectedRoute />, // 👈 THAY ĐỔI Ở ĐÂY
        
        // 2b. Tất cả những route này giờ là "con"
        // của ProtectedRoute. Chúng sẽ được render
        // vào <Outlet /> của ProtectedRoute NẾU có vé.
        children: [ 
          {
            path: '/', // Trang chủ của admin
            element: <AdminLayout />,
            children: [
              // Các trang con này sẽ được nhét vào <Outlet />
              // CỦA AdminLayout
              {
                index: true, // Trang chủ (khi path là '/')
                element: <DashboardPage />,
              },
              {
                path: 'tables', // URL sẽ là /tables
                element: <ManageTablesPage />,
              },
              // ... các trang quản lý khác
            ],
          },
        ]
      },
    ],
  },
]);

// ... (phần ReactDOM.createRoot) ...
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Cung cấp router cho toàn bộ ứng dụng */}
    <RouterProvider router={router} />
  </React.StrictMode>
);