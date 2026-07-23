function sanitizeRedirect(url: string | null, fallback: string): string {
  if (!url) return fallback;
  const cleaned = url.trim();
  if (!cleaned.startsWith('/') || cleaned.startsWith('//')) return fallback;
  return cleaned;
}

export function resolvePortalDestination({
  redirect,
  isAdmin,
  hasClientRecord,
  onboarded,
}: {
  redirect: string | null;
  isAdmin: boolean;
  hasClientRecord: boolean;
  onboarded: boolean;
}): string {
  // New clients must complete onboarding before any requested portal route.
  if (!isAdmin && !onboarded) return '/portal/welcome';

  const safeRedirect = sanitizeRedirect(redirect, '');
  if (safeRedirect && safeRedirect !== '/portal') return safeRedirect;
  if (isAdmin) return '/portal/admin';
  return hasClientRecord ? '/portal/dashboard' : '/portal/welcome';
}
