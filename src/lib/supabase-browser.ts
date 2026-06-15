/* ── Supabase Browser Client (auth-aware via @supabase/ssr) ── */
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
  // Next route chunks can evaluate this module more than once in the browser.
  // Keep the auth-aware client on globalThis so Supabase does not create
  // multiple GoTrue clients with the same storage key during portal navigation.
  var __jrSupabaseBrowserClient: SupabaseClient | undefined;
}

export function getAuthClient(): SupabaseClient {
  if (globalThis.__jrSupabaseBrowserClient) {
    return globalThis.__jrSupabaseBrowserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || !key) {
    // During build / SSG when env vars aren't available, return a stub
    // that won't crash. The portal is behind auth middleware anyway.
    globalThis.__jrSupabaseBrowserClient = createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
    );
    return globalThis.__jrSupabaseBrowserClient;
  }

  globalThis.__jrSupabaseBrowserClient = createBrowserClient(url, key);
  return globalThis.__jrSupabaseBrowserClient;
}
