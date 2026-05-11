'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export interface AuthUser {
  id: number;
  email: string;
  username: string;
}

interface AuthCtx {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.godoclab.com/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* Restore session from localStorage on mount */
  useEffect(() => {
    try {
      const raw = localStorage.getItem('auth');
      if (raw) {
        const parsed = JSON.parse(raw) as { user: AuthUser; token: string };
        setUser(parsed.user);
        setToken(parsed.token);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const persist = useCallback((u: AuthUser, t: string) => {
    localStorage.setItem('auth', JSON.stringify({ user: u, token: t }));
    setUser(u);
    setToken(t);
  }, []);

  const login = useCallback(
    async (emailOrUsername: string, password: string) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOrUsername, password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(d.message || 'Login failed');
      }
      const data = await res.json() as { access_token: string; user: AuthUser };
      persist(data.user, data.access_token);
    },
    [persist],
  );

  const signup = useCallback(
    async (email: string, username: string, password: string) => {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(d.message || 'Signup failed');
      }
      const data = await res.json() as { access_token: string; user: AuthUser };
      persist(data.user, data.access_token);
    },
    [persist],
  );

  const logout = useCallback(() => {
    localStorage.removeItem('auth');
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
}
