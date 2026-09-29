import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as superAdminAuthApi from '../api/superAdminAuth.js';
import { refreshPlatformAccessToken } from '../api/platformClient.js';

const SuperAdminAuthContext = createContext(null);

// Captured once at module load, before this ever swaps it - restored when
// SuperAdminAuthProvider unmounts (leaving /superadmin entirely). Mirrors
// hooks/useTenantDocumentHead.js's own default-capture pattern.
const DEFAULT_MANIFEST_HREF = typeof document !== 'undefined' ? document.querySelector('link[rel="manifest"]')?.href ?? null : null;

// Mirrors auth/AuthContext.jsx exactly, but against the separate superadmin
// credential (see api/platformClient.js) - kept as its own context rather
// than reusing AuthContext so a tenant session and a superadmin session can
// never be confused for one another.
export function SuperAdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [booting, setBooting] = useState(true);

  // Makes the superadmin console itself installable ("Add to Home Screen" /
  // desktop PWA install) with a fixed start_url of /superadmin, so the
  // installed icon always opens straight into the console (or its own login
  // page if the session has expired) rather than the tenant-resolution
  // logic at the bare domain root, which admin.packstack.co.za has no real
  // tenant for. Mounted once for this whole subtree (login <-> dashboard
  // navigation doesn't remount SuperAdminAuthProvider), unlike the
  // per-tenant manifest in useTenantDocumentHead.js, this one is fixed -
  // there's nothing tenant-specific to brand it with.
  useEffect(() => {
    let link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = '/superadmin-manifest.webmanifest';

    return () => {
      if (DEFAULT_MANIFEST_HREF) {
        const currentLink = document.querySelector('link[rel="manifest"]');
        if (currentLink) currentLink.href = DEFAULT_MANIFEST_HREF;
      }
    };
  }, []);

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
