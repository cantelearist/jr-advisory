/* ──────────────────────────────────────────────────────
   JR Advisory — Missing Tables Migration
   Phase 5B: Creates todo, signature_requests, notifications, site_content
   Run in Supabase SQL Editor after 001_initial_schema.sql
   ────────────────────────────────────────────────────── */

/* ══════════════════════════════════════════════════════
   1. ENUMS (add if not already present)
   ══════════════════════════════════════════════════════ */

/* Add 'payment' to timeline_type enum if not present */
DO $$ BEGIN
  ALTER TYPE timeline_type ADD VALUE IF NOT EXISTS 'payment';
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE todo_priority AS ENUM ('urgent', 'high', 'normal', 'low');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE todo_status AS ENUM ('pending', 'in_progress', 'done');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE signature_status AS ENUM ('pending', 'signed', 'declined', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('message', 'document', 'invoice', 'signature', 'phase', 'system');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE content_type AS ENUM ('text', 'html', 'markdown');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


/* ══════════════════════════════════════════════════════
   2. TODO TABLE
   ══════════════════════════════════════════════════════ */

CREATE TABLE IF NOT EXISTS todo (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id         uuid REFERENCES clients(id) ON DELETE CASCADE,
  engagement_id     uuid REFERENCES engagements(id) ON DELETE SET NULL,
  assigned_to       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title             text NOT NULL,
  description       text,
  priority          todo_priority NOT NULL DEFAULT 'normal',
  status            todo_status NOT NULL DEFAULT 'pending',
  due_date          date,
  completed_at      timestamptz,
  visible_to_client boolean NOT NULL DEFAULT false,
  created_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_todo_client      ON todo(client_id);
CREATE INDEX IF NOT EXISTS idx_todo_status      ON todo(status);
CREATE INDEX IF NOT EXISTS idx_todo_priority    ON todo(priority);
CREATE INDEX IF NOT EXISTS idx_todo_due_date    ON todo(due_date);

ALTER TABLE todo ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with todos
CREATE POLICY "Admins full access to todos"
  ON todo FOR ALL USING (is_admin());

-- Clients can see only todos marked visible_to_client for their own engagements
CREATE POLICY "Clients see visible todos"
  ON todo FOR SELECT USING (
    visible_to_client = true
    AND client_id IN (SELECT my_client_ids())
  );

-- updated_at trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON todo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


/* ══════════════════════════════════════════════════════
   3. SIGNATURE_REQUESTS TABLE
   ══════════════════════════════════════════════════════ */

CREATE TABLE IF NOT EXISTS signature_requests (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id       uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  client_id         uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  signer_name       text NOT NULL,
  signer_email      text NOT NULL DEFAULT '',
  message           text,
  status            signature_status NOT NULL DEFAULT 'pending',
  signature_data    text,            -- Base64-encoded signature image or decline reason
  signed_at         timestamptz,
  ip_address        inet,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sig_req_client   ON signature_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_sig_req_doc      ON signature_requests(document_id);
CREATE INDEX IF NOT EXISTS idx_sig_req_status   ON signature_requests(status);

ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;

-- Admins can manage all signature requests
CREATE POLICY "Admins full access to signatures"
  ON signature_requests FOR ALL USING (is_admin());

-- Clients can view their own signature requests
CREATE POLICY "Clients see own signatures"
  ON signature_requests FOR SELECT USING (
    client_id IN (SELECT my_client_ids())
  );

-- Clients can update their own pending signature requests (to sign/decline)
CREATE POLICY "Clients can sign own requests"
  ON signature_requests FOR UPDATE USING (
    client_id IN (SELECT my_client_ids())
    AND status = 'pending'
  ) WITH CHECK (
    status IN ('signed', 'declined')
  );

-- updated_at trigger
CREATE TRIGGER set_updated_at BEFORE UPDATE ON signature_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


/* ══════════════════════════════════════════════════════
   4. NOTIFICATIONS TABLE
   ══════════════════════════════════════════════════════ */

CREATE TABLE IF NOT EXISTS notifications (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  target            text NOT NULL,     -- 'firm' for admin, or client_id UUID string
  type              notification_type NOT NULL,
  title             text NOT NULL,
  body              text,
  link              text,              -- Portal page link e.g. '/portal/messages'
  read              boolean NOT NULL DEFAULT false,
  metadata          jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_target     ON notifications(target);
CREATE INDEX IF NOT EXISTS idx_notif_read       ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notif_created    ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notif_target_read ON notifications(target, read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Admins can see all notifications targeted to 'firm'
CREATE POLICY "Admins see firm notifications"
  ON notifications FOR SELECT USING (
    is_admin() AND target = 'firm'
  );

-- Admins can update (dismiss) firm notifications
CREATE POLICY "Admins dismiss firm notifications"
  ON notifications FOR UPDATE USING (
    is_admin() AND target = 'firm'
  );

-- Clients see notifications targeted to their client_id
CREATE POLICY "Clients see own notifications"
  ON notifications FOR SELECT USING (
    target IN (SELECT id::text FROM clients WHERE profile_id = auth.uid())
  );

-- Clients can dismiss their own notifications
CREATE POLICY "Clients dismiss own notifications"
  ON notifications FOR UPDATE USING (
    target IN (SELECT id::text FROM clients WHERE profile_id = auth.uid())
  );

-- System can insert notifications (service role bypasses RLS anyway, but belt-and-suspenders)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT WITH CHECK (true);


/* ══════════════════════════════════════════════════════
   5. SITE_CONTENT TABLE (CMS)
   ══════════════════════════════════════════════════════ */

CREATE TABLE IF NOT EXISTS site_content (
  id                text PRIMARY KEY,    -- e.g. 'hero_tagline'
  section           text NOT NULL,       -- e.g. 'hero', 'practice', 'founders'
  key               text NOT NULL,       -- e.g. 'tagline', 'description'
  label             text NOT NULL,       -- Human-readable label
  content           text NOT NULL,
  content_type      content_type NOT NULL DEFAULT 'text',
  updated_at        timestamptz NOT NULL DEFAULT now(),
  updated_by        uuid REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_content_section  ON site_content(section);
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_section_key ON site_content(section, key);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read site content (public website)
CREATE POLICY "Public read site content"
  ON site_content FOR SELECT USING (true);

-- Only admins can modify site content
CREATE POLICY "Admins manage site content"
  ON site_content FOR ALL USING (is_admin());


/* ══════════════════════════════════════════════════════
   6. ADD STRIPE COLUMNS TO INVOICES (if missing)
   ══════════════════════════════════════════════════════ */

DO $$ BEGIN
  ALTER TABLE invoices ADD COLUMN stripe_session_id text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE invoices ADD COLUMN stripe_payment_id text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;


/* ══════════════════════════════════════════════════════
   7. VERIFY
   ══════════════════════════════════════════════════════ */

-- Quick smoke test: these should all succeed silently
DO $$
BEGIN
  PERFORM 1 FROM todo LIMIT 0;
  PERFORM 1 FROM signature_requests LIMIT 0;
  PERFORM 1 FROM notifications LIMIT 0;
  PERFORM 1 FROM site_content LIMIT 0;
  RAISE NOTICE 'All four tables created successfully ✓';
END $$;
