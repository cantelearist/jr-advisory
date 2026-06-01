/* ──────────────────────────────────────────────────────
   JR Advisory — Missing Tables Migration (RETRY-SAFE)
   Wraps everything in DROP IF EXISTS → CREATE
   ────────────────────────────────────────────────────── */

/* ══════════════════════════════════════════════════════
   1. ENUMS (add if not already present)
   ══════════════════════════════════════════════════════ */

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

DROP POLICY IF EXISTS "Admins full access to todos" ON todo;
CREATE POLICY "Admins full access to todos"
  ON todo FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Clients see visible todos" ON todo;
CREATE POLICY "Clients see visible todos"
  ON todo FOR SELECT USING (
    visible_to_client = true
    AND client_id IN (SELECT my_client_ids())
  );

DROP TRIGGER IF EXISTS set_updated_at ON todo;
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
  signature_data    text,
  signed_at         timestamptz,
  ip_address        inet,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sig_req_client   ON signature_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_sig_req_doc      ON signature_requests(document_id);
CREATE INDEX IF NOT EXISTS idx_sig_req_status   ON signature_requests(status);

ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access to signatures" ON signature_requests;
CREATE POLICY "Admins full access to signatures"
  ON signature_requests FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Clients see own signatures" ON signature_requests;
CREATE POLICY "Clients see own signatures"
  ON signature_requests FOR SELECT USING (
    client_id IN (SELECT my_client_ids())
  );

DROP POLICY IF EXISTS "Clients can sign own requests" ON signature_requests;
CREATE POLICY "Clients can sign own requests"
  ON signature_requests FOR UPDATE USING (
    client_id IN (SELECT my_client_ids())
    AND status = 'pending'
  ) WITH CHECK (
    status IN ('signed', 'declined')
  );

DROP TRIGGER IF EXISTS set_updated_at ON signature_requests;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON signature_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


/* ══════════════════════════════════════════════════════
   4. NOTIFICATIONS TABLE
   ══════════════════════════════════════════════════════ */

CREATE TABLE IF NOT EXISTS notifications (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  target            text NOT NULL,
  type              notification_type NOT NULL,
  title             text NOT NULL,
  body              text,
  link              text,
  read              boolean NOT NULL DEFAULT false,
  metadata          jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_target     ON notifications(target);
CREATE INDEX IF NOT EXISTS idx_notif_read       ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notif_created    ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notif_target_read ON notifications(target, read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins see firm notifications" ON notifications;
CREATE POLICY "Admins see firm notifications"
  ON notifications FOR SELECT USING (
    is_admin() AND target = 'firm'
  );

DROP POLICY IF EXISTS "Admins dismiss firm notifications" ON notifications;
CREATE POLICY "Admins dismiss firm notifications"
  ON notifications FOR UPDATE USING (
    is_admin() AND target = 'firm'
  );

DROP POLICY IF EXISTS "Clients see own notifications" ON notifications;
CREATE POLICY "Clients see own notifications"
  ON notifications FOR SELECT USING (
    target IN (SELECT id::text FROM clients WHERE profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "Clients dismiss own notifications" ON notifications;
CREATE POLICY "Clients dismiss own notifications"
  ON notifications FOR UPDATE USING (
    target IN (SELECT id::text FROM clients WHERE profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT WITH CHECK (true);


/* ══════════════════════════════════════════════════════
   5. SITE_CONTENT TABLE (CMS)
   ══════════════════════════════════════════════════════ */

CREATE TABLE IF NOT EXISTS site_content (
  id                text PRIMARY KEY,
  section           text NOT NULL,
  key               text NOT NULL,
  label             text NOT NULL,
  content           text NOT NULL,
  content_type      content_type NOT NULL DEFAULT 'text',
  updated_at        timestamptz NOT NULL DEFAULT now(),
  updated_by        uuid REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_content_section  ON site_content(section);
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_section_key ON site_content(section, key);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read site content" ON site_content;
CREATE POLICY "Public read site content"
  ON site_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage site content" ON site_content;
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

DO $$
BEGIN
  PERFORM 1 FROM todo LIMIT 0;
  PERFORM 1 FROM signature_requests LIMIT 0;
  PERFORM 1 FROM notifications LIMIT 0;
  PERFORM 1 FROM site_content LIMIT 0;
  RAISE NOTICE 'All four tables created successfully ✓';
END $$;
