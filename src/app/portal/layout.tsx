import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Office — James Roman Advisory",
  description: "Private client portal for engagement management.",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
