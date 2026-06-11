import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/api-auth';
import { internalError } from '@/lib/api-error';

/* GET /api/pages/[id] — load a single page with full content */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { data, error } = await auth.sb
    .from('pages')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  return NextResponse.json({ page: data });
}

/* PUT /api/pages/[id] — update a page */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const allowed = ['title', 'slug', 'html', 'css', 'components', 'styles', 'status', 'meta_title', 'meta_description', 'sort_order'];
  const updates: Record<string, unknown> = {};

  for (const key of allowed) {
    if (key in body) {
      if (key === 'slug') {
        updates[key] = (body[key] as string)
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      } else {
        updates[key] = body[key];
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await auth.sb
    .from('pages')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A page with this slug already exists' }, { status: 409 });
    }
    return internalError(error, 'pages.[id]');
  }

  return NextResponse.json({ page: data });
}

/* DELETE /api/pages/[id] — delete a page */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { error } = await auth.sb
    .from('pages')
    .delete()
    .eq('id', id);

  if (error) {
    return internalError(error, 'pages.[id]');
  }

  return NextResponse.json({ success: true });
}
