import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from '../api/client';

export interface User {
  id: string;
  email: string;
  name: string;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (...perms: string[]) => boolean;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) return;
    api<User>('/auth/me')
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    window.addEventListener('erp:unauthorized', logout);
    return () => window.removeEventListener('erp:unauthorized', logout);
  }, [logout]);

  const login = async (email: string, password: string) => {
    const res = await api<{ accessToken: string; user: User }>('/auth/login', {
      body: { email, password },
    });
    tokenStore.set(res.accessToken);
    setUser(res.user);
  };

  const can = (...perms: string[]) =>
    !!user && perms.every((p) => user.permissions.includes(p));

  return <Ctx.Provider value={{ user, loading, login, logout, can }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth 必須在 AuthProvider 內使用');
  return v;
}
