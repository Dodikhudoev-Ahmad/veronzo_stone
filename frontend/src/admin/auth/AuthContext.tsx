import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import axios, { AxiosError } from 'axios';
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
  //
  // Uses a real AbortController, not just a `cancelled` flag, because the
  // refresh token is single-use/rotating (see AuthEndpoints.RefreshAsync's
  // atomic claim): React StrictMode mounts this effect, cleans it up, then
  // mounts it again, all synchronously. A `cancelled` flag only suppresses
  // which invocation's *result* gets applied to state — it doesn't stop the
  // first invocation's request from actually reaching the server. Both
  // requests would race for the same token; whichever wins rotates it and
  // 401s the other, and since JS dispatches the cleaned-up (first) request
  // marginally before the kept (second) one, the second — the one whose
  // result actually matters — consistently lost that race, so a real,
  // just-established session was reported as logged-out on every reload.
  // Aborting the discarded invocation's request in the cleanup function
  // means only one real request per mount ever reaches the server.
  useEffect(() => {
    const controller = new AbortController();

    authClient
      .post<AuthResponse>('/api/auth/refresh', undefined, {
        headers: { [CSRF_HEADER]: '1' },
        signal: controller.signal,
      })
      .then((response) => {
        applySession(response.data);
      })
      .catch((error: unknown) => {
        if (axios.isCancel(error)) {
          return;
        }
        // 401 here just means "no valid session" — not an error worth surfacing.
        if (!(error instanceof AxiosError && error.response?.status === 401)) {
          console.error('Session bootstrap failed', error);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
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
