/**
 * useAuth — auth-free stub.
 *
 * Authentication has been removed. The app runs entirely in local-storage
 * mode; no Supabase session is required. This stub preserves the exact same
 * hook API so all call-sites compile without modification.
 */
import { createContext, useContext } from 'react';

interface AuthContextType {
  user: null;
  loading: false;
  isAuthenticated: false;
}

const STUB: AuthContextType = { user: null, loading: false, isAuthenticated: false };

const AuthContext = createContext<AuthContextType>(STUB);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthContext.Provider value={STUB}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
