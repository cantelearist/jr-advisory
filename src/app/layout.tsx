import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://www.jamesroman.la";

export const viewport: Viewport = {
  themeColor: "#0a0b0e",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "James Roman Advisory · Independent Hazardous Material Advisory",
    template: "%s | James Roman Advisory",
  },
  description:
    "Independent, client-side advisory for hazardous-material remediation oversight in luxury homes across the Westside. Malibu, Beverly Hills, Bel Air, Brentwood, Pacific Palisades, Santa Monica.",
  keywords: [
    "hazardous material advisory",
    "mold remediation oversight",
    "asbestos abatement",
    "indoor air quality",
    "luxury home remediation",
    "independent environmental advisory",
    "Malibu",
    "Beverly Hills",
    "Pacific Palisades",
    "Brentwood",
    "Bel Air",
    "Santa Monica",
    "Los Angeles",
  ],
  authors: [{ name: "James Roman Advisory" }],
  creator: "James Roman Advisory",
  publisher: "James Roman Advisory",
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "James Roman Advisory · Independent Hazardous Material Advisory",
    description:
      "Respond. Protect. Restore. Independent hazardous-material advisory for the Westside's most private estates.",
    url: siteUrl,
    siteName: "James Roman Advisory",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "James Roman Advisory — Respond. Protect. Restore.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "James Roman Advisory · Independent Hazardous Material Advisory",
    description:
      "Respond. Protect. Restore. Independent hazardous-material advisory for the Westside's most private estates.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=JetBrains+Mono:wght@300;400&family=Manrope:wght@400;500;520;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
