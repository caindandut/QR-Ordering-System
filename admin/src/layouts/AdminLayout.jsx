import { Outlet } from 'react-router-dom';
// (Tưởng tượng bạn import Sidebar và Header ở đây)
// import Sidebar from '../components/Sidebar';
// import Header from '../components/Header';

// Hàm này render ra Sidebar, Header và "lỗ hổng" Outlet
export default function AdminLayout() {
  return (
    <div className="flex h-screen">
      {/* TODO: Tạo component Sidebar
        <Sidebar /> 
      */}
      <div className="w-64 bg-gray-900 text-white">Sidebar</div>

      {/* Phần nội dung chính */}
      <div className="flex-1 flex flex-col">
        {/* TODO: Tạo component Header
          <Header /> 
        */}
        <div className="h-16 bg-white border-b">Header</div>

        {/* Đây là "lỗ hổng" để nhét các trang con vào */}
        <main className="flex-1 p-4 overflow-auto bg-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
}