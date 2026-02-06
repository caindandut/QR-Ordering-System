import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { TitleUpdater } from '@/components/TitleUpdater';

export default function RootLayout() {
  return (
    <main>
      <TitleUpdater />
      <Outlet />
      <Toaster />
    </main>
  );
}
