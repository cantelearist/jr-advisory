/* ── GET /api/health — Integration health check ── */
/* Returns status of all external services. Requires admin session or internal key. */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isInternalSecretAuthorized } from '@/lib/internal-secret';

export const dynamic = 'force-dynamic';

interface ServiceStatus {
  status: 'ok' | 'degraded' | 'down' | 'unconfigured';
  detail?: string;
  latency_ms?: number;
}

async function checkSupabase(): Promise<ServiceStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { status: 'unconfigured', detail: 'Missing SUPABASE_URL or SERVICE_ROLE_KEY' };

  const start = Date.now();
  try {
    const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    const { error } = await sb.from('profiles').select('id').limit(1);
    const latency = Date.now() - start;
    if (error) return { status: 'degraded', detail: error.message, latency_ms: latency };
    return { status: 'ok', latency_ms: latency };
  } catch (e) {
    return { status: 'down', detail: e instanceof Error ? e.message : 'Connection failed' };
  }
}

async function checkSupabaseTables(): Promise<Record<string, 'ok' | 'missing' | string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return {};

  const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const tables = [
    'profiles', 'clients', 'engagements', 'documents', 'messages',
    'timeline_events', 'invoices', 'audit_log', 'nda_records',
    'todo', 'signature_requests', 'notifications', 'site_content',
  ];

  const results: Record<string, 'ok' | 'missing' | string> = {};
  for (const t of tables) {
    const { error } = await sb.from(t).select('id').limit(0);
    if (!error) results[t] = 'ok';
    else if (error.code === '42P01' || error.message.includes('does not exist')) results[t] = 'missing';
    else results[t] = error.message;
  }
  return results;
}

function checkStripe(): ServiceStatus {
  const key = process.env.STRIPE_SECRET_KEY;
  const webhook = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key) return { status: 'unconfigured', detail: 'Missing STRIPE_SECRET_KEY' };
  return {
    status: webhook ? 'ok' : 'degraded',
    detail: webhook ? 'API key + webhook secret configured' : 'API key set but STRIPE_WEBHOOK_SECRET missing (webhooks won\'t verify signatures)',
  };
}

function checkResend(): ServiceStatus {
  const key = process.env.RESEND_API_KEY || process.env.resend;
  if (!key) return { status: 'unconfigured', detail: 'Missing RESEND_API_KEY' };
  return { status: 'ok', detail: process.env.RESEND_API_KEY ? 'API key configured' : 'API key configured via legacy resend env var' };
}

function checkEnvVars(): Record<string, boolean> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    RESEND_API_KEY: !!(process.env.RESEND_API_KEY || process.env.resend),
    NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
    NOTIFICATION_FROM_EMAIL: !!process.env.NOTIFICATION_FROM_EMAIL,
    NOTIFICATION_SECRET: !!process.env.NOTIFICATION_SECRET,
  };
}

export async function GET(req: NextRequest) {
  /* Auth: require internal key or admin session */
  const key = req.nextUrl.searchParams.get('key');
  if (!isInternalSecretAuthorized(key, process.env.HEALTHCHECK_SECRET)) {
    /* Try admin session */
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && sKey) {
      const sb = createClient(url, sKey, { auth: { autoRefreshToken: false, persistSession: false } });
      const token = req.cookies.get('sb-access-token')?.value
        || req.headers.get('authorization')?.replace('Bearer ', '');
      if (token) {
        const { data: { user } } = await sb.auth.getUser(token);
        if (user) {
          const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
          if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
          }
        } else {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const [supabase, tables, stripe, resend] = await Promise.all([
    checkSupabase(),
    checkSupabaseTables(),
    Promise.resolve(checkStripe()),
    Promise.resolve(checkResend()),
  ]);

  const missingTables = Object.entries(tables).filter(([, v]) => v !== 'ok').map(([k]) => k);

  const overall = [supabase, stripe, resend].every(s => s.status === 'ok') && missingTables.length === 0
    ? 'healthy'
    : [supabase, stripe, resend].some(s => s.status === 'down')
      ? 'unhealthy'
      : 'degraded';

  return NextResponse.json({
    status: overall,
    timestamp: new Date().toISOString(),
    services: { supabase, stripe, resend },
    database: {
      tables,
      missing: missingTables.length > 0 ? missingTables : undefined,
      action: missingTables.length > 0
        ? 'Run supabase/migrations/002_missing_tables.sql in Supabase SQL Editor'
        : undefined,
    },
    env_vars: checkEnvVars(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
