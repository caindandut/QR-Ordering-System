// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import "Khung", "Cổng", "Trang" và "Trang Lỗi"
import RootLayout from './layouts/RootLayout';
import OrderGateway from './layouts/OrderGateway';
import HomePage from './pages/Home';
import ErrorPage from './pages/ErrorPage'; // 👈 1. IMPORT TRANG LỖI

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: '/', 
    element: <RootLayout />,
    errorElement: <ErrorPage />, 
    children: [
      {
        path: 'order', 
        element: <OrderGateway />,
        children: [
          {
            index: true,
            element: <HomePage />,
          },
        ]
      },
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);