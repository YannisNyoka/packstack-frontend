import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    // The access token lives only in memory (see api/client.js), so a page
    // reload always starts with none - this silently re-derives one from
    // the httpOnly refresh cookie before deciding whether the visitor is
    // actually logged out or just reloaded the page.
    let cancelled = false;
    (async () => {
      const refreshed = await authApi.refreshAccessToken();
      if (!refreshed) {
        if (!cancelled) setBooting(false);
        return;
      }
      try {
        const me = await authApi.getCurrentUser();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const loggedInUser = await authApi.login(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, booting, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() must be used within an AuthProvider');
  return ctx;
}
