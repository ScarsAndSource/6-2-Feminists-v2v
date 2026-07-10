import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, getOrCreateUser } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Track whether getOrCreateUser() has finished — we suppress auth-state
  // change events until then, because SIGNED_IN fires synchronously from
  // the cached session before signInAnonymously() even runs.
  const initialised = useRef(false);

  useEffect(() => {
    let cancelled = false;

    // 1. Establish (or restore) the anonymous session first.
    getOrCreateUser()
      .then(sessionUser => {
        if (cancelled) return;
        initialised.current = true;
        setUser(sessionUser);
        setLoading(false);
      })
      .catch(err => {
        console.error('[Auth] Failed to establish anonymous session:', err);
        if (cancelled) return;
        initialised.current = true;
        setUser(null);
        setLoading(false);
      });

    // 2. Stay in sync with any subsequent auth events (e.g. token refresh).
    //    We skip the initial INITIAL_SESSION event because getOrCreateUser
    //    already handles first-boot.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Ignore events that fire before initialisation completes — they're
      // the cached-session echo from the Supabase client init and would
      // incorrectly set loading=false before signInAnonymously resolves.
      if (!initialised.current) return;
      if (event === 'INITIAL_SESSION') return;
      setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
