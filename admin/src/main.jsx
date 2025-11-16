import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n';
import { Suspense } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "next-themes";
import { AdminRoute } from './components/AdminRoute';
import { SocketProvider } from './context/SocketProvider.jsx';
import RootLayout from './layouts/RootLayout';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import ManageTablesPage from './pages/ManageTables';
import { ProtectedRoute } from './components/ProtectedRoute';
import ManageOrdersPage from './pages/ManageOrders';
import ManageMenuPage from './pages/ManageMenu';
import ManageStaffPage from './pages/ManageStaff';
import ManageCategoriesPage from './pages/ManageCategories';
import AccountPage from './pages/Account';


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
            element: <SocketProvider><AdminLayout /></SocketProvider>,
            children: [
              {
                index: true,
                element: <DashboardPage />,
              },
              {
                path: 'tables',
                element: <ManageTablesPage />,
              },
              {
                path: 'orders', 
                element: <ManageOrdersPage />,
              },
              {
                path: 'menu', 
                element: <ManageMenuPage />,
              },
              {
                path: 'categories',
                element: <ManageCategoriesPage />,
              },
              {
                path: 'account',
                element: <AccountPage />
              },
              {
                element: <AdminRoute />,
                children: [
                  {
                    path : '/',
                    element: <SocketProvider><AdminLayout /></SocketProvider>,
                    children: [ 
                      {
                        path: 'staff',
                        element: <ManageStaffPage />,
                      }
                    ]
                  },
                ],
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
    <Suspense fallback={<div>Đang tải ngôn ngữ...</div>}>
      <ThemeProvider attribute="class" defaultTheme="system" storageKey="customer-ui-theme">
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </ThemeProvider>
    </Suspense>
  </React.StrictMode>
);