// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import các Layout và Trang
import RootLayout from './layouts/RootLayout';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import ManageTablesPage from './pages/ManageTables';
import { ProtectedRoute } from './components/ProtectedRoute';

// 👇 1. IMPORT CÁC TRANG MỚI
import ManageOrdersPage from './pages/ManageOrders';
import ManageMenuPage from './pages/ManageMenu';
import ManageStaffPage from './pages/ManageStaff';


const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/',
            element: <AdminLayout />,
            children: [
              {
                index: true,
                element: <DashboardPage />,
              },
              {
                path: 'tables', // URL sẽ là /tables
                element: <ManageTablesPage />,
              },
              // 👇 2. THÊM CÁC ROUTE MỚI VÀO ĐÂY
              {
                path: 'orders', // URL sẽ là /orders
                element: <ManageOrdersPage />,
              },
              {
                path: 'menu', // URL sẽ là /menu
                element: <ManageMenuPage />,
              },
              {
                path: 'staff', // URL sẽ là /staff
                element: <ManageStaffPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 👇 3. Bọc <RouterProvider> bằng <QueryClientProvider> */}
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);