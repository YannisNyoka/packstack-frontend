import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as customerAuthApi from '../api/customerAuth.js';
import { refreshCustomerAccessToken } from '../api/customerClient.js';

const CustomerAuthContext = createContext(null);

// Mirrors auth/AuthContext.jsx exactly, but against the separate customer
// account credential (see api/customerClient.js) - kept as its own context
// rather than reusing AuthContext so a logged-in customer session and a
// staff/owner dashboard session can never be confused for one another, even
// if both happen to be open in the same browser.
export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const refreshed = await refreshCustomerAccessToken();
      if (!refreshed) {
        if (!cancelled) setBooting(false);
        return;
      }
      try {
        const me = await customerAuthApi.getCurrentCustomer();
        if (!cancelled) setCustomer(me);
      } catch {
        if (!cancelled) setCustomer(null);
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signup = useCallback(async (data) => {
    const signedUpCustomer = await customerAuthApi.signup(data);
    setCustomer(signedUpCustomer);
    return signedUpCustomer;
  }, []);

  const login = useCallback(async (email, password) => {
    const loggedInCustomer = await customerAuthApi.login(email, password);
    setCustomer(loggedInCustomer);
    return loggedInCustomer;
  }, []);

  const logout = useCallback(async () => {
    await customerAuthApi.logout();
    setCustomer(null);
  }, []);

  const resetPassword = useCallback(async (token, password) => {
    const loggedInCustomer = await customerAuthApi.resetPassword(token, password);
    setCustomer(loggedInCustomer);
    return loggedInCustomer;
  }, []);

  return (
    <CustomerAuthContext.Provider
      value={{ customer, setCustomer, booting, signup, login, logout, resetPassword, forgotPassword: customerAuthApi.forgotPassword }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth() must be used within a CustomerAuthProvider');
  return ctx;
}
