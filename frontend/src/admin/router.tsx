import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './layout/AdminLayout';
import { AdminLoader } from './components/AdminLoader';

// Every admin page is code-split — none of this bundle loads until a route
// under /admin is actually visited.
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const ContentPage = lazy(() => import('./pages/ContentPage'));
const SeoPage = lazy(() => import('./pages/SeoPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

export function AdminRouter() {
  return (
    <Routes>
      <Route
        path="/admin/login"
        element={
          <Suspense fallback={<AdminLoader />}>
            <LoginPage />
          </Suspense>
        }
      />

      <Route path="/admin" element={<ProtectedRoute />}>
        {/* AdminLayout owns a single Suspense boundary around <Outlet/>, so
            pages nested here don't need their own. */}
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="content" element={<ContentPage />} />
          <Route path="seo" element={<SeoPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
