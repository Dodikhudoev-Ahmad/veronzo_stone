import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AxiosError } from 'axios';
import { authClient, CSRF_HEADER, setAccessToken, setUnauthorizedHandler } from '../api/client';
import { AuthContext, type AuthContextValue } from './context';
import type { AdminUserResponse, AuthResponse } from './types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AdminUserResponse | null>(null);
  // Starts true: on first mount we don't yet know whether a valid refreshToken
  // cookie exists, so ProtectedRoute must wait rather than assume logged-out.
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((response: AuthResponse) => {
    setAccessToken(response.accessToken);
    setCurrentUser(response.admin);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setCurrentUser(null);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authClient.post<AuthResponse>('/api/auth/login', { email, password });
      applySession(response.data);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await authClient.post('/api/auth/logout', undefined, { headers: { [CSRF_HEADER]: '1' } });
    } catch {
      // Best-effort — the cookie may already be gone/expired server-side.
      // Local state is cleared unconditionally below either way.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  // Silent session bootstrap: an httpOnly refresh cookie from a previous visit
  // may still be valid even though nothing is held in memory after a page
  // reload (by design — the access token never persists across reloads).
  useEffect(() => {
    let cancelled = false;

    authClient
      .post<AuthResponse>('/api/auth/refresh', undefined, { headers: { [CSRF_HEADER]: '1' } })
      .then((response) => {
        if (!cancelled) {
          applySession(response.data);
        }
      })
      .catch((error: unknown) => {
        // 401 here just means "no valid session" — not an error worth surfacing.
        if (!cancelled && !(error instanceof AxiosError && error.response?.status === 401)) {
          console.error('Session bootstrap failed', error);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applySession]);

  // The API client calls this when a background token refresh fails (e.g. the
  // refresh token was revoked elsewhere) so the UI drops back to logged-out
  // instead of silently repeating failed requests.
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isAuthenticated: currentUser !== null,
      loading,
      login,
      logout,
    }),
    [currentUser, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
