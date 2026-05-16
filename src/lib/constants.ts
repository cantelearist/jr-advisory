/* ─── James Roman Advisory — Shared constants ─── */

export const FIRM_NAME = "James Roman Advisory";
export const FIRM_YEAR = "MMXXVI";
export const FIRM_TAGLINE = "Counsel. Not Contractors.";
export const FIRM_DESCRIPTION =
  "Independent, client-side advisory for hazardous-material remediation oversight and property-integrity matters in luxury homes across the Westside.";

/* ─── Contact ─── */
export const CONTACT_PHONE = "+1 (310) 555-0100";
export const CONTACT_EMAIL = "private@jamesroman.la";
export const CONTACT_LOCATION = "Malibu, California · By appointment.";

/* ─── Service areas ─── */
export const SERVICE_AREAS = [
  "Bel Air",
  "Beverly Hills",
  "Brentwood",
  "Malibu",
  "Pacific Palisades",
  "Santa Monica",
] as const;

/* ─── Navigation ─── */
export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "The Practice", href: "#practice" },
  { label: "Counsel", href: "#counsel" },
  { label: "Engagement", href: "#engagement" },
  { label: "Discretion", href: "#discretion" },
  { label: "Contact", href: "#contact" },
];

/* ─── Practice stats ─── */
export interface PracticeStat {
  value: string;
  label: string;
  accent?: boolean;
}

export const PRACTICE_STATS: PracticeStat[] = [
  { value: "19", label: "Years in industry", accent: true },
  { value: "4–6", label: "Clients per quarter" },
  { value: "$0", label: "From contractors" },
];

/* ─── Counsel areas ─── */
export interface CounselArea {
  numeral: string;
  title: string;
  description: string;
}

export const COUNSEL_AREAS: CounselArea[] = [
  {
    numeral: "i",
    title: "Mold & Water Intrusion",
    description:
      "Independent moisture mapping, IEP-grade testing, and remediation oversight. The most common reason we are called.",
  },
  {
    numeral: "ii",
    title: "Asbestos & Legacy Materials",
    description:
      "Pre-1985 estates and mid-century renovations. Survey review, abatement oversight, and clearance verification.",
  },
  {
    numeral: "iii",
    title: "Lead-Based Paint",
    description:
      "Pre-1978 properties with families in residence. Risk assessment, contractor protocol review, and independent clearance.",
  },
  {
    numeral: "iv",
    title: "Fire & Smoke Residue",
    description:
      "Post-wildfire response, soot and char contamination, insurance-grade documentation, and rebuild coordination.",
  },
  {
    numeral: "v",
    title: "Indoor Air Quality & VOCs",
    description:
      "Persistent symptoms with no obvious cause. Testing coordination, source identification, and remediation strategy.",
  },
  {
    numeral: "vi",
    title: "Pre-Purchase Diligence",
    description:
      "What disclosure missed and what it will cost. Environmental review before acquisition of high-value residential property.",
  },
];

/* ─── Engagement phases ─── */
export interface EngagementPhase {
  numeral: string;
  title: string;
  description: string;
}

export const ENGAGEMENT_PHASES: EngagementPhase[] = [
  {
    numeral: "I",
    title: "Confidential Consultation",
    description:
      "A private call, then a walk-through under NDA. We listen to the matter, identify the parties involved, and determine if the engagement is a fit.",
  },
  {
    numeral: "II",
    title: "Independent Assessment",
    description:
      "Our own inspection coordination, sampling design, and IEP review — independent of any party proposing or performing the work.",
  },
  {
    numeral: "III",
    title: "Scope & Vendor Curation",
    description:
      "A written scope, side-by-side proposal comparison, and a shortlist of vetted firms. Assumptions named, exclusions surfaced, gaps closed.",
  },
  {
    numeral: "IV",
    title: "Oversight & Clearance",
    description:
      "On-site oversight through remediation. Progress documented, decisions coordinated. Independent post-remediation verification before sign-off.",
  },
];

/* ─── Discretion principles ─── */
export interface DiscretionPrinciple {
  numeral: string;
  title: string;
  description: string;
}

export const DISCRETION_PRINCIPLES: DiscretionPrinciple[] = [
  {
    numeral: "I",
    title: "Standing NDA",
    description:
      "Mutual non-disclosure before any property detail is shared. No exceptions.",
  },
  {
    numeral: "II",
    title: "No Public Client List",
    description:
      "We do not name clients, properties, or projects — ever. Representative experience is anonymized.",
  },
  {
    numeral: "III",
    title: "Encrypted Communications",
    description:
      "Signal or Proton by default for sensitive matters. Standard email only for scheduling.",
  },
  {
    numeral: "IV",
    title: "Off-Market Vendor Bench",
    description:
      "Firms accustomed to private estates and household staff. Vetted for discretion as much as competence.",
  },
  {
    numeral: "V",
    title: "Independence, Documented",
    description:
      "No referral fees, no kickbacks, no positions in any party. The conflict letter is page one of every engagement.",
  },
];

/* ─── Matters (anonymized case studies) ─── */
export interface Matter {
  area: string;
  scale: string;
  concern: string;
  role: string;
  outcome: string;
}

export const MATTERS: Matter[] = [
  {
    area: "Malibu, CA",
    scale: "~50,000 sq. ft. estate",
    concern: "Mold remediation oversight",
    role: "Protocol review, vendor scope, site sequencing, containment expectations, and closeout documentation.",
    outcome:
      "Clearer standards, documentation, and decision control through remediation.",
  },
  {
    area: "Pacific Palisades, CA",
    scale: "Large custom residence",
    concern: "Water intrusion + microbial growth",
    role: "Coordinated inspection path; reviewed contractor recommendations and identified missing documentation.",
    outcome:
      "Improved clarity before intrusive work; clearer remediation scope.",
  },
  {
    area: "Beverly Hills, CA",
    scale: "Luxury residential",
    concern: "Asbestos + build-back coordination",
    role: "Reviewed environmental documentation and coordinated specialist involvement before construction.",
    outcome:
      "Safer sequencing and clean separation between remediation and reconstruction.",
  },
  {
    area: "Brentwood, CA",
    scale: "High-value family res.",
    concern: "Smoke / fire-related contamination",
    role: "Organized reports, reviewed vendor proposals, and translated findings into practical decisions.",
    outcome:
      "A clearer path toward remediation, cleaning, and closeout.",
  },
];

/* ─── Footer columns ─── */
export interface FooterColumn {
  heading: string;
  items: { label: string; href: string }[];
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: "Practice",
    items: [
      { label: "The Practice", href: "#practice" },
      { label: "Counsel Areas", href: "#counsel" },
      { label: "Engagement", href: "#engagement" },
      { label: "Discretion", href: "#discretion" },
    ],
  },
  {
    heading: "Engagement",
    items: [
      { label: "Request a Consultation", href: "#contact" },
      { label: "Client Office", href: "#" },
      { label: "For Estate Managers", href: "#" },
      { label: "For Counsel + Advisors", href: "#" },
    ],
  },
  {
    heading: "Firm",
    items: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Disclaimer", href: "#" },
      { label: "Accessibility", href: "#" },
    ],
  },
];
