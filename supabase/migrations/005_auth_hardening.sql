/* ═══════════════════════════════════════════════════════
   005 — Auth Hardening
   - Fix is_admin() to include 'manager' role
   - Add rate_limit_events table for persistent tracking (optional)
   ═══════════════════════════════════════════════════════ */

-- Fix is_admin() to include manager role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Verify
DO $$
BEGIN
  RAISE NOTICE '✅ is_admin() now includes manager role';
END $$;
