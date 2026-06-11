/* GET /api/team — list all profiles (admin only) */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/api-auth';
import { internalError } from '@/lib/api-error';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { data, error } = await auth.sb
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return internalError(error, 'team');
  }

  return NextResponse.json({ users: data || [] });
}
