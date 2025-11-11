import { Outlet } from 'react-router-dom';
import CustomerHeader from '../components/Header';
import CartButton from '../components/CartButton';

export default function CustomerLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Header cố định */}
      <CustomerHeader />
      
      {/* 2. "Lỗ hổng" cho các trang con (Menu, Giỏ hàng) */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* 3. "Giỏ hàng mini" nằm trên cùng */}
      <CartButton />
    </div>
  );
}