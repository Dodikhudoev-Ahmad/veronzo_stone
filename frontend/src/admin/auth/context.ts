import { createContext } from 'react';
import type { AdminUserResponse } from './types';

export interface AuthContextValue {
  currentUser: AdminUserResponse | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
