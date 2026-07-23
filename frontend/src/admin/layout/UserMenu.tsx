import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export function UserMenu() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      navigate('/admin/login', { replace: true });
    }
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted">{currentUser?.email}</span>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="rounded-pill border border-cream-soft px-4 py-1.5 text-sm text-text transition hover:border-accent hover:text-accent disabled:opacity-60"
      >
        {loggingOut ? 'Выход…' : 'Выйти'}
      </button>
    </div>
  );
}
