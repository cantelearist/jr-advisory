import type { Metadata } from 'next';
import { AuthProvider } from '@/components/portal/AuthProvider';

/* Portal pages require Supabase at runtime — never statically render them */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'The Private Office — James Roman Advisory',
  description: 'Restricted private office for active James Roman Advisory engagements.',
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
