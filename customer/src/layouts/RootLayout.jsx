import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout() {
  return (
    <main>
      <Outlet />
      <Toaster />
    </main>
  );
}