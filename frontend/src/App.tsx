import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './admin/api/queryClient';
import { AuthProvider } from './admin/auth/AuthContext';

// Lazy-loaded so a public site visitor's bundle never includes the admin
// panel's code (react-hook-form, zod, every admin page/Tailwind CSS) and
// vice versa -- previously both were eagerly imported here, so every
// homepage visit downloaded the entire admin panel too. Each router's own
// module (and its own CSS import, e.g. PublicRouter's "./styles.css") only
// loads once its "/admin/*" or "/*" branch actually matches.
const AdminRouter = lazy(() => import('./admin/router').then((m) => ({ default: m.AdminRouter })));
const PublicRouter = lazy(() => import('./public/PublicRouter').then((m) => ({ default: m.PublicRouter })));

// AdminRouter owns everything under /admin (including its own login/*/catch-all
// redirect), so it's mounted behind a "/admin/*" boundary here — any path
// that doesn't start with /admin falls through to the public marketing site.
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/admin/*" element={<AdminRouter />} />
              <Route path="/*" element={<PublicRouter />} />
            </Routes>
          </Suspense>
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
