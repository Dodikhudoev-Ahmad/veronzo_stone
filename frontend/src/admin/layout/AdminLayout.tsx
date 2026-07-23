import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AdminErrorBoundary } from '../components/AdminErrorBoundary';
import { AdminLoader } from '../components/AdminLoader';

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-bg font-sans text-text">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-8">
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
