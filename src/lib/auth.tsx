'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { getDatabase, SEED_CLIENTS } from './testData';
import type { Profile, Client } from './database.types';
import type { Client as TestClient } from './testData';
import type { User, Session } from '@supabase/supabase-js';

/* ── Types ── */
interface AuthState {
  user: User | null;
  profile: Profile | null;
  client: Client | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  isDemo: boolean; // true when using localStorage fallback
}

interface AuthContextType extends AuthState {
  signIn: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  demoLogin: (clientId: string) => void;
}

/* ── Fallback: convert test data Client to DB Client shape ── */
function toDbClient(tc: TestClient): Client {
  return {
    id: tc.id,
    profile_id: null,
    name: tc.name,
    email: tc.email,
    phone: tc.phone,
    property: tc.property,
    area: tc.area,
    status: tc.status,
    notes: null,
    created_at: tc.createdAt,
    updated_at: tc.createdAt,
  };
}

/* ── Context ── */
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    client: null,
    session: null,
    isAdmin: false,
    loading: true,
    isDemo: !isSupabaseConfigured(),
  });

  /* ── Supabase auth listener ── */
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Demo mode: check localStorage for active client
      const clientId = localStorage.getItem('jr_active_client');
      if (clientId) {
        const db = getDatabase();
        const tc = db.clients.find(c => c.id === clientId);
        if (tc) {
          setState(s => ({
            ...s,
            client: toDbClient(tc),
            loading: false,
            isDemo: true,
          }));
          return;
        }
      }
      setState(s => ({ ...s, loading: false, isDemo: true }));
      return;
    }

    // Real Supabase auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user, session);
      } else {
        setState(s => ({ ...s, loading: false }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await loadProfile(session.user, session);
        } else {
          setState({
            user: null, profile: null, client: null,
            session: null, isAdmin: false, loading: false, isDemo: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(user: User, session: Session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    let client: Client | null = null;
    if (profile && profile.role === 'client') {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('profile_id', user.id)
        .single();
      client = data;
    }

    setState({
      user,
      profile: profile || null,
      client,
      session,
      isAdmin: profile?.role === 'admin',
      loading: false,
      isDemo: false,
    });
  }

  /* ── Sign in with magic link ── */
  const signIn = useCallback(async (email: string) => {
    if (!isSupabaseConfigured()) {
      // Demo fallback
      const tc = SEED_CLIENTS.find(c => c.email.toLowerCase() === email.toLowerCase());
      if (tc) {
        localStorage.setItem('jr_active_client', tc.id);
        setState(s => ({ ...s, client: toDbClient(tc), isDemo: true }));
        return { error: null };
      }
      return { error: 'No matching test account' };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/portal/dashboard`,
      },
    });
    return { error: error?.message || null };
  }, []);

  /* ── Sign out ── */
  const signOut = useCallback(async () => {
    if (state.isDemo) {
      localStorage.removeItem('jr_active_client');
      setState(s => ({
        ...s, user: null, profile: null, client: null,
        session: null, isAdmin: false, isDemo: true,
      }));
      return;
    }
    await supabase.auth.signOut();
  }, [state.isDemo]);

  /* ── Demo login (test accounts) ── */
  const demoLogin = useCallback((clientId: string) => {
    localStorage.setItem('jr_active_client', clientId);
    const db = getDatabase();
    const tc = db.clients.find(c => c.id === clientId);
    if (tc) {
      setState(s => ({ ...s, client: toDbClient(tc), isDemo: true }));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, demoLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Require auth — redirects to /portal if not authenticated */
export function useRequireAuth() {
  const auth = useAuth();
  useEffect(() => {
    if (!auth.loading && !auth.client && !auth.isAdmin && !auth.user) {
      window.location.href = '/portal';
    }
  }, [auth.loading, auth.client, auth.isAdmin, auth.user]);
  return auth;
}

/** Require admin — redirects to /portal if not admin */
export function useRequireAdmin() {
  const auth = useAuth();
  useEffect(() => {
    if (!auth.loading && !auth.isAdmin && !auth.isDemo) {
      window.location.href = '/portal';
    }
  }, [auth.loading, auth.isAdmin, auth.isDemo]);
  return auth;
}
