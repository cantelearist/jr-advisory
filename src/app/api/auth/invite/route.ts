/* ── Invite Client — Admin creates auth account for a client ── */
/* POST /api/auth/invite { clientId } */

import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit';
import { internalError } from '@/lib/api-error';
import { requireAdmin, isAuthError } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit
  const rl = checkRateLimit(ip, 'invite', RATE_LIMITS.invite);
  if (!rl.allowed) {
    logAudit({
      action: AUDIT_ACTIONS.RATE_LIMITED,
      entity_type: 'auth',
      metadata: { route: '/api/auth/invite', ip },
      ip_address: ip,
    });
    return NextResponse.json({ error: rl.message }, { status: 429 });
  }

  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const { user, sb: admin } = auth;

  const body = await req.json();
  const { clientId } = body;

  if (!clientId) {
    return NextResponse.json(
      { error: 'clientId required' },
      { status: 400 }
    );
  }

  // Get client record
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, profile_id')
    .eq('id', clientId)
    .single();

  if (!client) {
    return NextResponse.json(
      { error: 'Client not found' },
      { status: 404 }
    );
  }

  // Check if client already has an account
  if (client.profile_id) {
    return NextResponse.json({
      message: 'Client already has an account',
      profile_id: client.profile_id,
    });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    return NextResponse.json({ error: 'Site URL not configured' }, { status: 503 });
  }

  // Create the account through Supabase's invitation flow. Never generate or
  // return a reusable password from an API response.
  try {
    const { data: newUser, error } = await admin.auth.admin.inviteUserByEmail(client.email, {
      redirectTo: `${siteUrl.replace(/\/$/, '')}/portal`,
      data: {
        full_name: client.name,
        role: 'client',
        onboarded: false,
      },
    });

    if (error) throw error;

    // Link profile to client
    await admin
      .from('clients')
      .update({ profile_id: newUser.user!.id })
      .eq('id', clientId);

    logAudit({
      user_id: user.id,
      action: AUDIT_ACTIONS.INVITE_CREATED,
      entity_type: 'auth',
      metadata: { client_id: clientId, client_email: client.email },
      ip_address: ip,
    });

    return NextResponse.json({
      success: true,
      email: client.email,
      message: `Invitation sent to ${client.email}.`,
    });
  } catch (e: unknown) {
    return internalError(e, 'auth.invite');
  }
}
