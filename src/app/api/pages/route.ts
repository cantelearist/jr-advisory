import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/api-auth';

/* GET /api/pages — list all pages */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { data, error } = await auth.sb
    .from('pages')
    .select('id, title, slug, status, meta_title, meta_description, sort_order, created_at, updated_at')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pages: data || [] });
}

/* POST /api/pages — create a new page */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const { title, slug } = body;

  if (!title || !slug) {
    return NextResponse.json({ error: 'title and slug are required' }, { status: 400 });
  }

  // Sanitize slug
  const cleanSlug = (slug as string)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Prevent reserved slugs
  const reserved = ['portal', 'api', 'admin', 'auth', 'login', 'signup', 'accessibility', 'privacy', 'terms', 'counsel', 'engagements'];
  if (reserved.includes(cleanSlug)) {
    return NextResponse.json({ error: `"${cleanSlug}" is a reserved slug` }, { status: 400 });
  }

  const { data, error } = await auth.sb
    .from('pages')
    .insert({
      title,
      slug: cleanSlug,
      html: '',
      css: '',
      components: [],
      styles: [],
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A page with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ page: data }, { status: 201 });
}
