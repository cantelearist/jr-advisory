import type { Metadata } from 'next';
import { AuthProvider } from '@/components/portal/AuthProvider';

export const metadata: Metadata = {
  title: 'Client Office — James Roman Advisory',
  description: 'Private client portal for engagement management.',
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
