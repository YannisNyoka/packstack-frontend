import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as superAdminAuthApi from '../api/superAdminAuth.js';
import { refreshPlatformAccessToken } from '../api/platformClient.js';

const SuperAdminAuthContext = createContext(null);

// Mirrors auth/AuthContext.jsx exactly, but against the separate superadmin
// credential (see api/platformClient.js) - kept as its own context rather
// than reusing AuthContext so a tenant session and a superadmin session can
// never be confused for one another.
export function SuperAdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const refreshed = await refreshPlatformAccessToken();
      if (!refreshed) {
        if (!cancelled) setBooting(false);
        return;
      }
      try {
        const me = await superAdminAuthApi.getCurrentAdmin();
        if (!cancelled) setAdmin(me);
      } catch {
        if (!cancelled) setAdmin(null);
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const loggedInAdmin = await superAdminAuthApi.login(email, password);
    setAdmin(loggedInAdmin);
    return loggedInAdmin;
  }, []);

  const logout = useCallback(async () => {
    await superAdminAuthApi.logout();
    setAdmin(null);
  }, []);

  return <SuperAdminAuthContext.Provider value={{ admin, booting, login, logout }}>{children}</SuperAdminAuthContext.Provider>;
}

export function useSuperAdminAuth() {
  const ctx = useContext(SuperAdminAuthContext);
  if (!ctx) throw new Error('useSuperAdminAuth() must be used within a SuperAdminAuthProvider');
  return ctx;
}
