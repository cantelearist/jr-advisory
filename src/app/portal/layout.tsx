import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Office — James Roman Advisory',
  description: 'Private client portal for James Roman Advisory engagements.',
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000000',
        color: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}
