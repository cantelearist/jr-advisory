import ApprovedHomepage from "@/components/homepage/ApprovedHomepage";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "James Roman Advisory",
  description:
    "Independent, client-side advisory for hazardous-material remediation oversight in luxury homes across the Westside.",
  url: "https://www.jamesroman.la",
  telephone: "+13104302500",
  email: "roman@jamesroman.la",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Malibu",
    addressRegion: "CA",
    addressCountry: "US",
  },
  areaServed: [
    { "@type": "City", name: "Malibu" },
    { "@type": "City", name: "Beverly Hills" },
    { "@type": "City", name: "Bel Air" },
    { "@type": "City", name: "Brentwood" },
    { "@type": "City", name: "Pacific Palisades" },
    { "@type": "City", name: "Santa Monica" },
  ],
  knowsAbout: [
    "Hazardous material remediation",
    "Mold remediation oversight",
    "Asbestos abatement",
    "Lead-based paint assessment",
    "Indoor air quality",
    "Fire and smoke remediation",
  ],
  slogan: "Protecting The Coast We Call Home.",
  priceRange: "$$$$",
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ApprovedHomepage />
    </>
  );
}
