import type { Metadata } from "next";
import RedesignedHomepage from "@/components/homepage/RedesignedHomepage";

export const metadata: Metadata = {
  title: "James Roman Advisory — Redesign Preview",
  description:
    "Preview of the warm-authority homepage redesign. Not linked from the live site.",
  robots: { index: false, follow: false },
};

export default function RedesignPreviewPage() {
  return <RedesignedHomepage />;
}
