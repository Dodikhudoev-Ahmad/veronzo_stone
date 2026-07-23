import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './admin/api/queryClient';
import { AuthProvider } from './admin/auth/AuthContext';
import { AdminRouter } from './admin/router';

// This stage only builds the admin panel foundation — the public marketing
// site (index.html/css/js at the repo root) is untouched and migrates to
// React separately. App only mounts the admin router for now.
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AdminRouter />
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
