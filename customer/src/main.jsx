import React from 'react';
import ReactDOM from 'react-dom/client';
import { Suspense } from 'react';
import './index.css';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import RootLayout from './layouts/RootLayout';
import OrderGateway from './layouts/OrderGateway';
import CustomerLayout from './layouts/CustomerLayout';
import MenuPage from './pages/Menu';
import ErrorPage from './pages/ErrorPage';
import CartPage from './pages/Cart';
import OrderStatusPage from './pages/OrderStatus';
import './i18n';

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
            element: <CustomerLayout />, 
            children: [
              {
                index: true, 
                element: <MenuPage />,
              },
              {
                path: 'cart',
                element: <CartPage />,
              },
              {
                path: 'status', 
                element: <OrderStatusPage />,
              },
            ]
          }
        ]
      },
    ]
  }
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