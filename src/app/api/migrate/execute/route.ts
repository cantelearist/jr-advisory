/* ── POST /api/migrate/execute — One-shot DDL runner (TEMPORARY) ── */
/* Accepts database connection string, runs missing-table DDL, self-documents */

import { NextResponse } from 'next/server';
import postgres from 'postgres';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  if (key !== 'jr-migrate-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { connection_string?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const connStr = body.connection_string;
  if (!connStr) {
    return NextResponse.json({ error: 'Missing connection_string in body' }, { status: 400 });
  }

  const sql = postgres(connStr, { ssl: 'require', connect_timeout: 15, max: 1 });

  const log: string[] = [];
  try {
    /* 0. Extension */
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    log.push('✓ uuid-ossp extension');

    /* 1. Enums */
    const enumSql = [
      `DO $$ BEGIN ALTER TYPE timeline_type ADD VALUE IF NOT EXISTS 'payment'; EXCEPTION WHEN others THEN NULL; END $$`,
      `DO $$ BEGIN CREATE TYPE todo_priority AS ENUM ('urgent','high','normal','low'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `DO $$ BEGIN CREATE TYPE todo_status AS ENUM ('pending','in_progress','done'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `DO $$ BEGIN CREATE TYPE signature_status AS ENUM ('pending','signed','declined','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('message','document','invoice','signature','phase','system'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `DO $$ BEGIN CREATE TYPE content_type AS ENUM ('text','html','markdown'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    ];
    for (const s of enumSql) { await sql.unsafe(s); }
    log.push('✓ enums');

    /* 2. todo table (may already exist) */
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS todo (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
        engagement_id uuid REFERENCES engagements(id) ON DELETE SET NULL,
        assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
        title text NOT NULL,
        description text,
        priority todo_priority NOT NULL DEFAULT 'normal',
        status todo_status NOT NULL DEFAULT 'pending',
        due_date date,
        completed_at timestamptz,
        visible_to_client boolean NOT NULL DEFAULT false,
        created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_todo_client ON todo(client_id)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_todo_status ON todo(status)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_todo_priority ON todo(priority)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_todo_due_date ON todo(due_date)`);
    await sql.unsafe(`ALTER TABLE todo ENABLE ROW LEVEL SECURITY`);
    await sql.unsafe(`DROP POLICY IF EXISTS "Admins full access to todos" ON todo`);
    await sql.unsafe(`CREATE POLICY "Admins full access to todos" ON todo FOR ALL USING (is_admin()) WITH CHECK (is_admin())`);
    await sql.unsafe(`DROP POLICY IF EXISTS "Clients see visible todos" ON todo`);
    await sql.unsafe(`CREATE POLICY "Clients see visible todos" ON todo FOR SELECT USING (visible_to_client = true AND client_id IN (SELECT my_client_ids()))`);
    await sql.unsafe(`DROP TRIGGER IF EXISTS set_updated_at ON todo`);
    await sql.unsafe(`CREATE TRIGGER set_updated_at BEFORE UPDATE ON todo FOR EACH ROW EXECUTE FUNCTION update_updated_at()`);
    log.push('✓ todo table');

    /* 3. signature_requests table */
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS signature_requests (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        signer_name text NOT NULL,
        signer_email text NOT NULL DEFAULT '',
        message text,
        status signature_status NOT NULL DEFAULT 'pending',
        signature_data text,
        signed_at timestamptz,
        ip_address inet,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_sig_req_client ON signature_requests(client_id)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_sig_req_doc ON signature_requests(document_id)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_sig_req_status ON signature_requests(status)`);
    await sql.unsafe(`ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY`);
    await sql.unsafe(`DROP POLICY IF EXISTS "Admins full access to signatures" ON signature_requests`);
    await sql.unsafe(`CREATE POLICY "Admins full access to signatures" ON signature_requests FOR ALL USING (is_admin()) WITH CHECK (is_admin())`);
    await sql.unsafe(`DROP POLICY IF EXISTS "Clients see own signatures" ON signature_requests`);
    await sql.unsafe(`CREATE POLICY "Clients see own signatures" ON signature_requests FOR SELECT USING (client_id IN (SELECT my_client_ids()))`);
    await sql.unsafe(`DROP POLICY IF EXISTS "Clients can sign own requests" ON signature_requests`);
    await sql.unsafe(`CREATE POLICY "Clients can sign own requests" ON signature_requests FOR UPDATE USING (client_id IN (SELECT my_client_ids()) AND status = 'pending') WITH CHECK (status IN ('signed','declined'))`);
    await sql.unsafe(`DROP TRIGGER IF EXISTS set_updated_at ON signature_requests`);
    await sql.unsafe(`CREATE TRIGGER set_updated_at BEFORE UPDATE ON signature_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at()`);
    log.push('✓ signature_requests table');

    /* 4. notifications table */
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS notifications (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        target text NOT NULL,
        type notification_type NOT NULL,
        title text NOT NULL,
        body text,
        link text,
        read boolean NOT NULL DEFAULT false,
        metadata jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_notif_target ON notifications(target)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(read)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_notif_created ON notifications(created_at)`);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_notif_target_read ON notifications(target, read)`);
    await sql.unsafe(`ALTER TABLE notifications ENABLE ROW LEVEL SECURITY`);
    await sql.unsafe(`DROP POLICY IF EXISTS "Admins see firm notifications" ON notifications`);
    await sql.unsafe(`CREATE POLICY "Admins see firm notifications" ON notifications FOR SELECT USING (is_admin() AND target = 'firm')`);
    await sql.unsafe(`DROP POLICY IF EXISTS "Admins dismiss firm notifications" ON notifications`);
    await sql.unsafe(`CREATE POLICY "Admins dismiss firm notifications" ON notifications FOR UPDATE USING (is_admin() AND target = 'firm') WITH CHECK (is_admin() AND target = 'firm')`);
    await sql.unsafe(`DROP POLICY IF EXISTS "Clients see own notifications" ON notifications`);
    await sql.unsafe(`CREATE POLICY "Clients see own notifications" ON notifications FOR SELECT USING (target IN (SELECT id::text FROM clients WHERE profile_id = auth.uid()))`);
    await sql.unsafe(`DROP POLICY IF EXISTS "Clients dismiss own notifications" ON notifications`);
    await sql.unsafe(`CREATE POLICY "Clients dismiss own notifications" ON notifications FOR UPDATE USING (target IN (SELECT id::text FROM clients WHERE profile_id = auth.uid())) WITH CHECK (target IN (SELECT id::text FROM clients WHERE profile_id = auth.uid()))`);
    await sql.unsafe(`DROP POLICY IF EXISTS "System can insert notifications" ON notifications`);
    await sql.unsafe(`CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true)`);
    log.push('✓ notifications table');

    /* 5. site_content table (may already exist) */
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS site_content (
        id text PRIMARY KEY,
        section text NOT NULL,
        key text NOT NULL,
        label text NOT NULL,
        content text NOT NULL,
        content_type content_type NOT NULL DEFAULT 'text',
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL
      )
    `);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_content_section ON site_content(section)`);
    await sql.unsafe(`CREATE UNIQUE INDEX IF NOT EXISTS idx_content_section_key ON site_content(section, key)`);
    await sql.unsafe(`ALTER TABLE site_content ENABLE ROW LEVEL SECURITY`);
    await sql.unsafe(`DROP POLICY IF EXISTS "Public read site content" ON site_content`);
    await sql.unsafe(`CREATE POLICY "Public read site content" ON site_content FOR SELECT USING (true)`);
    await sql.unsafe(`DROP POLICY IF EXISTS "Admins manage site content" ON site_content`);
    await sql.unsafe(`CREATE POLICY "Admins manage site content" ON site_content FOR ALL USING (is_admin()) WITH CHECK (is_admin())`);
    log.push('✓ site_content table');

    /* 6. Stripe columns on invoices */
    await sql.unsafe(`DO $$ BEGIN ALTER TABLE invoices ADD COLUMN stripe_session_id text; EXCEPTION WHEN duplicate_column THEN NULL; END $$`);
    await sql.unsafe(`DO $$ BEGIN ALTER TABLE invoices ADD COLUMN stripe_payment_id text; EXCEPTION WHEN duplicate_column THEN NULL; END $$`);
    log.push('✓ stripe columns on invoices');

    /* 7. Verify */
    const tables = ['todo', 'signature_requests', 'notifications', 'site_content'];
    const missing: string[] = [];
    for (const t of tables) {
      try {
        await sql.unsafe(`SELECT 1 FROM ${t} LIMIT 0`);
      } catch {
        missing.push(t);
      }
    }

    await sql.end();

    if (missing.length > 0) {
      return NextResponse.json({ status: 'partial', log, missing });
    }

    return NextResponse.json({ status: 'ok', message: 'All tables created ✓', log });
  } catch (err: unknown) {
    await sql.end().catch(() => {});
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: 'error', log, error: message }, { status: 500 });
  }
}
