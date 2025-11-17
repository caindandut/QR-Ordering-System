// src/layouts/AdminLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { NotificationProvider } from '../context/NotificationContext';

export default function AdminLayout() {
  return (
    <NotificationProvider>
      <div className="flex h-screen">
        
        {/* 👇 BỌC SIDEBAR BẰNG DIV NÀY */}
        {/* Div này sẽ ẩn Sidebar trên mobile (<md) */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Phần nội dung chính */}
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-4 overflow-auto bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}