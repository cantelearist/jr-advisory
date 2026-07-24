/* ──────────────────────────────────────────────────────
   JR Advisory — Change Orders
   Preserves original invoices/contracts and records amendments separately.
   ────────────────────────────────────────────────────── */

DO $$ BEGIN
  CREATE TYPE change_order_status AS ENUM ('draft', 'sent', 'approved', 'declined', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE change_order_source_type AS ENUM ('invoice', 'contract');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'change_order';
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE doc_category ADD VALUE IF NOT EXISTS 'contracts';
  ALTER TYPE doc_category ADD VALUE IF NOT EXISTS 'change-orders';
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS change_orders (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id            uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  engagement_id        uuid NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  change_order_number  text NOT NULL UNIQUE,
  source_type          change_order_source_type NOT NULL,
  source_invoice_id    uuid REFERENCES invoices(id) ON DELETE RESTRICT,
  source_document_id   uuid REFERENCES documents(id) ON DELETE RESTRICT,
  title                text NOT NULL,
  description          text NOT NULL,
  amount_delta         numeric(12,2) NOT NULL DEFAULT 0,
  status               change_order_status NOT NULL DEFAULT 'draft',
  issued_at            timestamptz,
  approved_at          timestamptz,
  declined_at          timestamptz,
  created_by           uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT change_orders_source_matches_type CHECK (
    (source_type = 'invoice' AND source_invoice_id IS NOT NULL AND source_document_id IS NULL)
    OR
    (source_type = 'contract' AND source_document_id IS NOT NULL AND source_invoice_id IS NULL)
  ),
  CONSTRAINT invoice_change_order_has_financial_delta CHECK (
    source_type <> 'invoice' OR amount_delta <> 0
  )
);

CREATE INDEX IF NOT EXISTS idx_change_orders_client
  ON change_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_engagement
  ON change_orders(engagement_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_invoice
  ON change_orders(source_invoice_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_document
  ON change_orders(source_document_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status
  ON change_orders(status);

ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access to change orders" ON change_orders;
CREATE POLICY "Admins full access to change orders"
  ON change_orders FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Clients see issued change orders" ON change_orders;
CREATE POLICY "Clients see issued change orders"
  ON change_orders FOR SELECT
  USING (
    client_id IN (SELECT my_client_ids())
    AND status IN ('sent', 'approved', 'declined')
  );

DROP TRIGGER IF EXISTS set_updated_at ON change_orders;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON change_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
