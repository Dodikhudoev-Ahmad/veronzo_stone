import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { AuthResponse } from '../auth/types';

// Every request needs the backend's CSRF gate satisfied for the cookie-based
// refresh flow (see backend/VeronzoApi/Endpoints/AuthEndpoints.cs — refresh/logout
// require this header whenever the refreshToken cookie is present). The value
// itself is not a secret; its presence is what forces a CORS preflight that an
// untrusted origin can't pass.
const CSRF_HEADER = 'X-CSRF-Token';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:5103';

// In-memory only — never persisted to localStorage/sessionStorage, per the
// project's auth architecture (access tokens must not be readable by anything
// that can also read arbitrary JS, i.e. must not survive an XSS beyond page load).
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// Called by AuthProvider so the client can push auth-state changes (e.g. force
// a logged-out state when a background refresh fails) without importing React
// context machinery into this module.
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

// Dedicated instance for the auth endpoints themselves (login/refresh/logout) —
// deliberately has no interceptors, so refreshing never recursively triggers the
// 401 handler below.
export const authClient = axios.create({ baseURL, withCredentials: true });

export const apiClient = axios.create({ baseURL, withCredentials: true });

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Multiple requests can 401 at once (e.g. a page firing several queries right
// as the access token expires) — this dedupes concurrent refresh attempts into
// a single in-flight call instead of racing the backend's refresh-rotation.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= authClient
    .post<AuthResponse>('/api/auth/refresh', undefined, { headers: { [CSRF_HEADER]: '1' } })
    .then((response) => {
      setAccessToken(response.data.accessToken);
      return response.data.accessToken;
    })
    .catch(() => {
      setAccessToken(null);
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;

    if (error.response?.status !== 401 || !config || config._retried) {
      return Promise.reject(error);
    }

    config._retried = true;
    const newToken = await refreshAccessToken();

    if (!newToken) {
      onUnauthorized?.();
      return Promise.reject(error);
    }

    config.headers.Authorization = `Bearer ${newToken}`;
    return apiClient.request(config);
  },
);

export { CSRF_HEADER };
