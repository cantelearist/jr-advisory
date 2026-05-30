/* ── Supabase Browser Client (auth-aware via @supabase/ssr) ── */
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getAuthClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!url || !key) {
      // During build / SSG when env vars aren't available, return a stub
      // that won't crash. The portal is behind auth middleware anyway.
      return createBrowserClient(
        'https://placeholder.supabase.co',
        'placeholder-key'
      );
    }

    _client = createBrowserClient(url, key);
  }
  return _client;
}
