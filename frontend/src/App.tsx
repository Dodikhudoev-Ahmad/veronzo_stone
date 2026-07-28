import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './admin/api/queryClient';
import { AuthProvider } from './admin/auth/AuthContext';
import { AdminRouter } from './admin/router';
import { PublicRouter } from './public/PublicRouter';

// AdminRouter owns everything under /admin (including its own login/*/catch-all
// redirect), so it's mounted behind a "/admin/*" boundary here — any path
// that doesn't start with /admin falls through to the public marketing site.
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/admin/*" element={<AdminRouter />} />
            <Route path="/*" element={<PublicRouter />} />
          </Routes>
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
