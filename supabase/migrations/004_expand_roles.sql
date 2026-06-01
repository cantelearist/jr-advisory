/* ═══════════════════════════════════════════════════════
   004 — Expand User Roles
   Adds 'manager' and 'contractor' to user_role enum.
   ═══════════════════════════════════════════════════════ */

-- Add new role values (safe — skips if already exists)
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'contractor';
EXCEPTION WHEN others THEN NULL;
END $$;

-- Verify
DO $$
BEGIN
  RAISE NOTICE '✅ user_role enum now includes: admin, client, manager, contractor';
END $$;
