import { Outlet, useLocation } from 'react-router-dom';
import CustomerHeader from '../components/Header';
import CartButton from '../components/CartButton';

export default function CustomerLayout() {
  const location = useLocation();
  const shouldShowCartButton = location.pathname !== '/order/cart';
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Header cố định */}
      <CustomerHeader />
      
      {/* 2. "Lỗ hổng" cho các trang con (Menu, Giỏ hàng) */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* 3. "Giỏ hàng mini" nằm trên cùng */}
      {shouldShowCartButton && <CartButton/>}
    </div>
  );
}