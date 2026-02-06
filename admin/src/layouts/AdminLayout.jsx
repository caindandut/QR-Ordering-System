import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { NotificationProvider } from '../context/NotificationContext';

export default function AdminLayout() {
  return (
    <NotificationProvider>
      <div className="flex h-screen">
        
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-2 sm:p-4 md:p-6 overflow-auto bg-background">
            <Outlet />
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}
