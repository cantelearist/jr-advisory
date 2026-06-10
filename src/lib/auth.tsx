'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { getSupabase, isSupabaseConfigured } from './supabase';
import type { Profile, Client } from './database.types';
import type { User, Session } from '@supabase/supabase-js';

/* ── Types ── */
interface AuthState {
  user: User | null;
  profile: Profile | null;
  client: Client | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
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
    error: null,
  });

  /* ── Supabase auth listener ── */
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      /* ── FAIL LOUDLY: never silently downgrade to demo mode ── */
      setState(s => ({
        ...s,
        loading: false,
        error:
          'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.',
      }));
      return;
    }

    // Real Supabase auth
    getSupabase().auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user, session);
      } else {
        setState(s => ({ ...s, loading: false }));
      }
    });

    const { data: { subscription } } = getSupabase().auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await loadProfile(session.user, session);
        } else {
          setState({
            user: null, profile: null, client: null,
            session: null, isAdmin: false, loading: false, error: null,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(user: User, session: Session) {
    const { data: profileData } = await getSupabase()
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const profile = profileData as Profile | null;

    let client: Client | null = null;
    if (profile && profile.role === 'client') {
      const { data } = await getSupabase()
        .from('clients')
        .select('*')
        .eq('profile_id', user.id)
        .single();
      client = data as Client | null;
    }

    setState({
      user,
      profile,
      client,
      session,
      isAdmin: profile?.role === 'admin' || profile?.role === 'manager',
      loading: false,
      error: null,
    });
  }

  /* ── Sign in with magic link ── */
  const signIn = useCallback(async (email: string) => {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase is not configured. Cannot sign in.' };
    }

    const { error } = await getSupabase().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/portal/dashboard`,
      },
    });
    return { error: error?.message || null };
  }, []);

  /* ── Sign out ── */
  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
  }, []);

  /* ── If Supabase isn't configured, render a clear error ── */
  if (state.error) {
    return (
      <AuthContext.Provider value={{ ...state, signIn, signOut }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
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
    if (!auth.loading && !auth.isAdmin) {
      window.location.href = '/portal';
    }
  }, [auth.loading, auth.isAdmin]);
  return auth;
}
