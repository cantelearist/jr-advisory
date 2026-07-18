/*
   007 — Security policy hardening

   Privileged profile roles must never come from client-controlled auth
   metadata. Server-side setup/invite flows assign roles explicitly after the
   auth user is created.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'client'::public.user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

/* All signature mutations go through the authenticated server API, which
   verifies ownership and writes with the service role. */
DROP POLICY IF EXISTS "Clients can sign own requests" ON public.signature_requests;
REVOKE UPDATE ON public.signature_requests FROM anon, authenticated;

/* Notifications and audit records are server-generated. The public client
   must not be able to forge firm notifications or security history. */
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Clients dismiss own notifications" ON public.notifications;
REVOKE INSERT, UPDATE ON public.notifications FROM anon, authenticated;

DROP POLICY IF EXISTS "System can insert audit log" ON public.audit_log;
REVOKE INSERT ON public.audit_log FROM anon, authenticated;

/* Client messages are also sent through /api/messages/send, where the
   engagement/client relationship and sender identity are checked server-side.
   Keep the admin policy for existing admin-side data tooling. */
DROP POLICY IF EXISTS "Clients can send messages" ON public.messages;
