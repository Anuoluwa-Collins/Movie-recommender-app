import { useCallback, useEffect, useState } from 'react';
import * as api from '../lib/api';
import type { User } from '../types';

export type AuthView = 'login' | 'register';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // If any request comes back 401, api.ts clears the token and calls this —
  // reflect that in UI state so stale "logged in" UI doesn't linger.
  useEffect(() => {
    api.onUnauthorized(() => setUser(null));
  }, []);

  const login = useCallback(async (emailOrUsername: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const me = await api.login(emailOrUsername, password);
      setUser({ id: me.id, username: me.username, email: me.email });
      return true;
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Login failed');
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        await api.register(username, email, password);
        // Auto-login after registration
        const me = await api.login(email, password);
        setUser({ id: me.id, username: me.username, email: me.email });
        return true;
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Registration failed');
        return false;
      } finally {
        setAuthLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
    setAuthError(null);
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  return { user, authError, authLoading, login, register, logout, clearAuthError };
}
