import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNavDrawer } from './MobileNavDrawer';
import { AdminErrorBoundary } from '../components/AdminErrorBoundary';
import { AdminLoader } from '../components/AdminLoader';

export function AdminLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="admin-shell flex min-h-screen bg-bg font-sans text-text">
      <Sidebar />
      <MobileNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="min-w-0 flex-1 p-8">
          <AdminErrorBoundary>
            <Suspense fallback={<AdminLoader />}>
              <Outlet />
            </Suspense>
          </AdminErrorBoundary>
        </main>
      </div>
    </div>
  );
}
