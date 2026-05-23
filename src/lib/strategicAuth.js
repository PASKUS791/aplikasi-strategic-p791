/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 *
 * Module: Strategic Auth Provider
 * Purpose: Provider auth khusus website Strategic.
 */

import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearStoredStrategicSession,
  loginStrategic,
  logoutStrategic,
  refreshStrategicSession,
} from "./strategicApi";

const AuthContext = createContext(null);

function AuthProviderInner({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshSession = useCallback(async () => {
    try {
      const session = await refreshStrategicSession();
      setUser(session?.user || null);
      setError("");
    } catch {
      setUser(null);
      clearStoredStrategicSession();
      setError("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(
    async (_scope, username, password) => {
      const session = await loginStrategic(username, password);
      const nextUser = session?.user || null;
      setUser(nextUser);
      setError("");
      return nextUser;
    },
    [setError, setUser],
  );

  const logout = useCallback(async () => {
    await logoutStrategic();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      logout,
      refreshSession,
      isScopeAuthenticated: (scope) => user?.scope === scope,
    }),
    [error, loading, login, logout, refreshSession, user],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function AuthProvider({ children }) {
  return createElement(AuthProviderInner, null, children);
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside StrategicAuthProvider.");
  }

  return context;
}
