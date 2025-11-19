import { Outlet } from 'react-router-dom';
import CustomerHeader from '../components/Header';
import MobileBottomNav from '../components/MobileBottomNav';

export default function CustomerLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Header cố định */}
      <CustomerHeader />
      
      {/* 2. "Lỗ hổng" cho các trang con (Menu, Giỏ hàng) */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      
      <MobileBottomNav />
    </div>
  );
}