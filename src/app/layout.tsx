import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "James Roman Advisory · Independent Hazardous Material Advisory",
  description:
    "Independent, client-side advisory for hazardous-material remediation oversight in luxury homes across the Westside. Malibu, Beverly Hills, Bel Air, Brentwood, Pacific Palisades, Santa Monica.",
  metadataBase: new URL("https://jamesroman.la"),
  openGraph: {
    title: "James Roman Advisory · Independent Hazardous Material Advisory",
    description:
      "Counsel. Not Contractors. Independent hazardous-material advisory for the Westside's most private estates.",
    type: "website",
  },
  themeColor: "#0a0b0e",
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
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@200;300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=JetBrains+Mono:wght@300;400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
