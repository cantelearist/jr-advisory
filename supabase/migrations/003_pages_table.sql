/* ═══════════════════════════════════════════════════════
   003 — Pages Table (Visual Page Builder)
   ═══════════════════════════════════════════════════════ */

-- Page status enum
DO $$ BEGIN
  CREATE TYPE page_status AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Pages table
CREATE TABLE IF NOT EXISTS pages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL DEFAULT 'Untitled Page',
  slug          text UNIQUE NOT NULL,
  html          text NOT NULL DEFAULT '',
  css           text NOT NULL DEFAULT '',
  components    jsonb NOT NULL DEFAULT '[]'::jsonb,
  styles        jsonb NOT NULL DEFAULT '[]'::jsonb,
  status        page_status NOT NULL DEFAULT 'draft',
  meta_title    text,
  meta_description text,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Index for slug lookups (published pages)
CREATE INDEX IF NOT EXISTS idx_pages_slug_status ON pages (slug, status);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_pages_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pages_updated_at ON pages;
CREATE TRIGGER pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION update_pages_timestamp();

-- RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Admin full access
DROP POLICY IF EXISTS pages_admin_all ON pages;
CREATE POLICY pages_admin_all ON pages
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Public read for published pages
DROP POLICY IF EXISTS pages_public_read ON pages;
CREATE POLICY pages_public_read ON pages
  FOR SELECT
  USING (status = 'published');

-- Verify
DO $$
BEGIN
  ASSERT (SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pages')),
    'pages table was not created';
  RAISE NOTICE '✅ pages table created successfully';
END $$;
