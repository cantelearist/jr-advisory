'use client';

/* ── Auth Provider — session state for all portal pages ── */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { getAuthClient } from '@/lib/supabase-browser';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import type { Profile, Client as DBClient } from '@/lib/database.types';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  clientRecord: DBClient | null;
  supabase: SupabaseClient;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

function implicitSessionFromUrl(): { access_token: string; refresh_token: string } | null {
  if (typeof window === 'undefined' || !window.location.hash) return null;

  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) return null;

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
  };
}

function clearAuthTokensFromUrl() {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.hash = '';
  window.history.replaceState(window.history.state, '', url.toString());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => getAuthClient());
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clientRecord, setClientRecord] = useState<DBClient | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(
    async (u: User) => {
      // Fetch profile (RLS: users can read own profile, admins read all)
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .single();
      setProfile(prof);

      // If client role, fetch their client record
      const role = prof?.role || u.app_metadata?.role || 'client';
      if (role === 'client') {
        const { data: cli } = await supabase
          .from('clients')
          .select('*')
          .eq('profile_id', u.id)
          .single();
        setClientRecord(cli);
      } else {
        setClientRecord(null);
      }
    },
    [supabase]
  );

  useEffect(() => {
    // Initial session load
    const init = async () => {
      try {
        const urlSession = implicitSessionFromUrl();
        if (urlSession) {
          try {
            await supabase.auth.setSession(urlSession);
          } catch {
            // Keep the gate usable and avoid leaving tokens in browser history.
          } finally {
            clearAuthTokensFromUrl();
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await loadProfile(currentUser);
        }
      } finally {
        setLoading(false);
      }
    };
    init();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await loadProfile(u);
      } else {
        setProfile(null);
        setClientRecord(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, loadProfile]);

  const signOut = async () => {
    // Server-side logout: revokes refresh token, clears cookies
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Fallback: client-side signOut if server call fails
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setClientRecord(null);
    // Full page reload to clear all client-side state
    window.location.href = '/portal';
  };

  const isAdmin =
    profile?.role === 'admin' ||
    profile?.role === 'manager' ||
    user?.app_metadata?.role === 'admin' ||
    user?.app_metadata?.role === 'manager';

  return (
    <AuthCtx.Provider
      value={{ user, profile, clientRecord, supabase, isAdmin, loading, signOut }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
