/* ── Audit Logger — writes to audit_log table ──
 *
 * Logs auth/security events to the existing audit_log table.
 * Uses service-role client so writes aren't blocked by RLS.
 * Fire-and-forget by default (doesn't block the request).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface AuditEntry {
  /** Auth user ID (null for unauthenticated events like failed login) */
  user_id?: string | null;
  /** Action identifier, e.g. 'auth.login.success', 'auth.mfa.verify' */
  action: string;
  /** Entity type, e.g. 'auth', 'message', 'invite' */
  entity_type: string;
  /** Entity ID if applicable */
  entity_id?: string | null;
  /** Additional context */
  metadata?: Record<string, unknown> | null;
  /** Client IP address */
  ip_address?: string | null;
}

let _serviceClient: SupabaseClient | null = null;

function getServiceClient(): SupabaseClient | null {
  if (_serviceClient) return _serviceClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  _serviceClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return _serviceClient;
}

/**
 * Log an audit event. Fire-and-forget — errors are swallowed.
 */
export function logAudit(entry: AuditEntry): void {
  const sb = getServiceClient();
  if (!sb) return;

  sb.from('audit_log')
    .insert({
      user_id: entry.user_id || null,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id || null,
      metadata: entry.metadata || null,
      ip_address: entry.ip_address || null,
    })
    .then(({ error }) => {
      if (error) {
        console.error('[audit] Failed to log:', error.message, entry.action);
      }
    });
}

/**
 * Log an audit event and wait for it to complete.
 * Use when the audit record must exist before responding.
 */
export async function logAuditSync(entry: AuditEntry): Promise<void> {
  const sb = getServiceClient();
  if (!sb) return;

  const { error } = await sb.from('audit_log').insert({
    user_id: entry.user_id || null,
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id || null,
    metadata: entry.metadata || null,
    ip_address: entry.ip_address || null,
  });

  if (error) {
    console.error('[audit] Failed to log:', error.message, entry.action);
  }
}

/* ── Standard action constants ── */
export const AUDIT_ACTIONS = {
  // Auth
  LOGIN_SUCCESS: 'auth.login.success',
  LOGIN_FAILED: 'auth.login.failed',
  LOGOUT: 'auth.logout',
  MAGIC_LINK_SENT: 'auth.magic_link.sent',
  PASSWORD_RESET_REQUESTED: 'auth.password_reset.requested',
  PASSWORD_RESET_COMPLETED: 'auth.password_reset.completed',
  INVITE_CREATED: 'auth.invite.created',

  // MFA
  MFA_ENROLLED: 'auth.mfa.enrolled',
  MFA_VERIFIED: 'auth.mfa.verified',
  MFA_FAILED: 'auth.mfa.failed',
  MFA_UNENROLLED: 'auth.mfa.unenrolled',

  // Rate limiting
  RATE_LIMITED: 'security.rate_limited',

  // Messages
  MESSAGE_READ: 'message.read',
  MESSAGE_SENT: 'message.sent',
  MESSAGE_DELETED: 'message.deleted',
} as const;
