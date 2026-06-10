/* ─── James Roman Advisory — Shared constants ─── */

export const FIRM_NAME = "James Roman Advisory";
export const FIRM_YEAR = "MMXXVI";
export const FIRM_TAGLINE = "Respond. Protect. Restore.";
export const FIRM_DESCRIPTION =
  "Independent, client-side advisory for hazardous-material remediation oversight and property-integrity matters in luxury homes across the Westside.";

/* ─── Contact ─── */
export const CONTACT_PHONE = "+1 (310) 430-2500";
export const CONTACT_EMAIL = "roman@jamesroman.la";
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
  { label: "Origin", href: "#origin" },
  { label: "The Cornerstone", href: "#cornerstones" },
  { label: "Private Office", href: "#private-office" },
];

/* ─── Practice stats ─── */
export interface PracticeStat {
  value: string;
  label: string;
  accent?: boolean;
}

export const PRACTICE_STATS: PracticeStat[] = [
  { value: "19", label: "Years in industry", accent: true },
  { value: "4\u20136", label: "Clients per quarter" },
  { value: "$0", label: "From contractors" },
];

/* ─── Counsel areas ─── */
export interface CounselArea {
  numeral: string;
  slug: string;
  title: string;
  description: string;
  detail: {
    overview: string;
    process: string[];
    indicators: string[];
    timeline: string;
  };
}

export const COUNSEL_AREAS: CounselArea[] = [
  {
    numeral: "i",
    slug: "mold-water-intrusion",
    title: "Mold & Water Intrusion",
    description:
      "Independent moisture mapping, IEP-grade testing, and remediation oversight. The most common reason we are called.",
    detail: {
      overview: "Water intrusion and resulting microbial growth are the most frequent concerns brought to our firm. The issue is rarely visible mold on a wall \u2014 it is what is behind the wall, beneath the flooring, or within the HVAC system that creates long-term exposure risk. Our role is to identify, quantify, and manage the response independently of the contractors who will perform the work.",
      process: [
        "Initial walkthrough and visual assessment under NDA",
        "Independent moisture mapping using thermal imaging and probe instruments",
        "IEP-coordinated air and surface sampling with accredited laboratory analysis",
        "Written scope of work development based on findings",
        "Vendor evaluation, proposal comparison, and shortlist curation",
        "On-site remediation oversight with photo documentation",
        "Post-remediation verification testing and clearance report",
      ],
      indicators: [
        "Persistent musty odors that intensify with HVAC operation",
        "Visible staining, bubbling, or warping in walls, ceilings, or flooring",
        "Family members experiencing unexplained respiratory symptoms",
        "Previous water events (leaks, floods, fire suppression) without documented remediation",
        "Elevated humidity readings during property inspection",
      ],
      timeline: "Typical engagement: 8\u201314 weeks from consultation to clearance, depending on scope and contractor availability.",
    },
  },
  {
    numeral: "ii",
    slug: "asbestos-legacy-materials",
    title: "Asbestos & Legacy Materials",
    description:
      "Pre-1985 estates and mid-century renovations. Survey review, abatement oversight, and clearance verification.",
    detail: {
      overview: "Homes built before 1985 \u2014 particularly mid-century modern estates and historically significant properties \u2014 often contain asbestos in materials that are invisible to the untrained eye: floor tiles, pipe insulation, ceiling textures, roofing, and even plaster. Disturbance during renovation without proper identification and abatement creates airborne exposure that is both hazardous and legally significant. We coordinate the identification process and oversee the abatement independently.",
      process: [
        "Pre-renovation or pre-purchase environmental survey coordination",
        "Review of existing survey reports for completeness and accuracy",
        "Coordination with certified asbestos inspectors and laboratories",
        "Abatement scope development and contractor qualification review",
        "On-site monitoring during abatement with air sampling",
        "Post-abatement clearance testing and documentation",
        "Coordination with general contractor for safe construction sequencing",
      ],
      indicators: [
        "Property constructed before 1985 with original or partially updated materials",
        "Planned renovation involving walls, floors, ceilings, or mechanical systems",
        "No environmental survey on record despite property age",
        "Previous partial renovation without documented material testing",
        "Acquisition of an estate with unknown renovation history",
      ],
      timeline: "Typical engagement: 6\u201312 weeks for survey through clearance. Complex estates with multiple structures may require phased approach.",
    },
  },
  {
    numeral: "iii",
    slug: "lead-based-paint",
    title: "Lead-Based Paint",
    description:
      "Pre-1978 properties with families in residence. Risk assessment, contractor protocol review, and independent clearance.",
    detail: {
      overview: "Lead-based paint remains present in the majority of homes built before 1978. In luxury properties where families are in residence during renovation, the risk is not theoretical \u2014 it is immediate. Dust generated during paint disturbance is the primary exposure pathway, particularly for children. We provide independent risk assessment, ensure contractor protocols meet or exceed federal and state requirements, and verify clearance before re-occupancy.",
      process: [
        "XRF testing and risk assessment of painted surfaces in renovation zones",
        "Review of contractor\u2019s lead-safe work practices and certifications",
        "Development of occupant protection plan for families in residence",
        "On-site monitoring of dust containment and work practices",
        "Independent dust wipe sampling at completion of each work phase",
        "Clearance verification against EPA and California standards",
        "Written clearance report for property records",
      ],
      indicators: [
        "Property built before 1978 with original paint layers",
        "Renovation planned in areas with painted surfaces (windows, doors, trim, walls)",
        "Children or pregnant occupants in residence during construction",
        "Peeling, chipping, or deteriorating paint on interior or exterior surfaces",
        "Previous renovation without documented lead testing",
      ],
      timeline: "Typical engagement: 4\u201310 weeks. Duration depends on renovation scope and number of work phases requiring clearance.",
    },
  },
  {
    numeral: "iv",
    slug: "fire-smoke-residue",
    title: "Fire & Smoke Residue",
    description:
      "Post-wildfire response, soot and char contamination, insurance-grade documentation, and rebuild coordination.",
    detail: {
      overview: "After wildfire, the visible damage is only part of the story. Smoke and soot residue penetrate soft materials, HVAC systems, wall cavities, and insulation in ways that are not immediately apparent. The remediation industry responds to fire events at scale, and the quality gap between firms is significant. We provide independent documentation, scope development, and oversight to ensure the remediation meets the standard your home and family deserve \u2014 not the minimum an insurance adjuster will approve.",
      process: [
        "Initial property assessment and photo documentation under NDA",
        "Soot and char contamination mapping across all affected zones",
        "Air quality testing for particulates, VOCs, and combustion byproducts",
        "Written remediation scope independent of insurance carrier estimates",
        "Vendor qualification review and proposal comparison",
        "On-site remediation oversight with progress documentation",
        "Post-remediation air quality verification and clearance",
        "Insurance documentation support with independent findings",
      ],
      indicators: [
        "Property within wildfire evacuation zone, even without direct flame contact",
        "Visible soot or smoke odor inside the home after a fire event",
        "HVAC system operated during or immediately after a fire event",
        "Insurance-proposed remediation scope that feels insufficient",
        "Contractor proposing \u201ccleaning\u201d without documented testing",
      ],
      timeline: "Typical engagement: 10\u201320 weeks. Post-fire engagements are often more complex due to insurance coordination and contractor availability.",
    },
  },
  {
    numeral: "v",
    slug: "indoor-air-quality",
    title: "Indoor Air Quality & VOCs",
    description:
      "Persistent symptoms with no obvious cause. Testing coordination, source identification, and remediation strategy.",
    detail: {
      overview: "When occupants experience persistent headaches, respiratory irritation, fatigue, or neurological symptoms that improve when away from the property, indoor air quality is often the undiagnosed cause. Sources can include off-gassing from new construction materials, hidden mold, inadequate ventilation, combustion appliance leakage, or volatile organic compounds from finishes and adhesives. We coordinate the testing, identify the source, and develop a remediation strategy that addresses the root cause \u2014 not just the symptoms.",
      process: [
        "Detailed occupant interview and symptom pattern documentation",
        "Comprehensive IAQ testing: VOCs, formaldehyde, CO, CO2, particulates, humidity",
        "HVAC system inspection and airflow analysis",
        "Source identification through targeted sampling and process of elimination",
        "Written remediation strategy addressing identified sources",
        "Vendor coordination for source removal or mitigation",
        "Post-remediation verification testing and ongoing monitoring plan",
      ],
      indicators: [
        "Occupants experiencing symptoms that improve when away from the property",
        "New construction or recent renovation with strong chemical odors",
        "Inadequate ventilation in tightly sealed luxury construction",
        "Multiple HVAC zones with inconsistent air quality",
        "Previous testing that found \u201cnothing\u201d but symptoms persist",
      ],
      timeline: "Typical engagement: 6\u201312 weeks. Source identification can be complex; some engagements require iterative testing.",
    },
  },
  {
    numeral: "vi",
    slug: "pre-purchase-diligence",
    title: "Pre-Purchase Diligence",
    description:
      "What disclosure missed and what it will cost. Environmental review before acquisition of high-value residential property.",
    detail: {
      overview: "Standard property inspections are designed to identify visible defects. They are not designed to identify environmental conditions that are invisible, costly, and potentially hazardous. Before acquiring a significant residential property, an independent environmental review identifies what disclosure missed, what it will cost to address, and whether the property\u2019s condition aligns with the acquisition price. This is not a home inspection \u2014 it is a targeted environmental assessment performed before you sign.",
      process: [
        "Confidential pre-acquisition consultation (property identity protected)",
        "Desktop review of property history, age, construction materials, and prior permits",
        "Targeted environmental assessment: asbestos, lead, mold, IAQ, soil (as applicable)",
        "Review of existing inspection and disclosure documents for gaps",
        "Written findings report with estimated remediation costs",
        "Advisory on negotiation leverage based on environmental findings",
        "Post-acquisition remediation coordination if engagement continues",
      ],
      indicators: [
        "Property acquisition above $5M with limited environmental disclosure",
        "Pre-1985 construction with planned renovation",
        "Property with known water history (floods, leaks, proximity to coast)",
        "Estate with multiple structures and unknown renovation history",
        "Seller disclosure that is vague, incomplete, or suspiciously clean",
      ],
      timeline: "Typical engagement: 2\u20134 weeks for assessment and report. Can be expedited for time-sensitive acquisitions.",
    },
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
      "Our own inspection coordination, sampling design, and IEP review \u2014 independent of any party proposing or performing the work.",
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
      "We do not name clients, properties, or projects \u2014 ever. Representative experience is anonymized.",
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
  id: string;
  area: string;
  scale: string;
  concern: string;
  role: string;
  outcome: string;
  detail: {
    overview: string;
    challenges: string[];
    approach: string;
    result: string;
  };
}

export const MATTERS: Matter[] = [
  {
    id: "malibu-estate",
    area: "Malibu, CA",
    scale: "~50,000 sq. ft. estate",
    concern: "Mold remediation oversight",
    role: "Protocol review, vendor scope, site sequencing, containment expectations, and closeout documentation.",
    outcome:
      "Clearer standards, documentation, and decision control through remediation.",
    detail: {
      overview: "A large coastal estate with persistent moisture issues traced to multiple entry points including roof junctions, subterranean drainage failures, and window assemblies. The scope of microbial contamination was significantly underestimated by the initial contractor assessment.",
      challenges: [
        "Multiple moisture entry points across a 50,000 sq. ft. property",
        "Contractor\u2019s initial scope addressed only visible damage, missing concealed contamination",
        "Family wished to remain in unaffected wings during remediation",
        "Insurance carrier disputed scope expansion after initial estimate",
      ],
      approach: "We commissioned an independent moisture mapping survey that identified seven additional zones of concern. The remediation scope was rewritten from the ground up, vendor proposals were compared against the expanded scope, and work was sequenced to allow partial occupancy. Each phase was independently verified before proceeding to the next.",
      result: "The final remediation scope was 3.2x the original contractor estimate. All seven zones were addressed, documented, and cleared through independent post-remediation verification. The engagement established a documentation standard the client now requires for all property work.",
    },
  },
  {
    id: "pacific-palisades",
    area: "Pacific Palisades, CA",
    scale: "Large custom residence",
    concern: "Water intrusion + microbial growth",
    role: "Coordinated inspection path; reviewed contractor recommendations and identified missing documentation.",
    outcome:
      "Improved clarity before intrusive work; clearer remediation scope.",
    detail: {
      overview: "A custom-built residence experiencing recurring water intrusion following seasonal rains. Multiple contractors had proposed solutions over several years, none of which resolved the underlying issue. The homeowner sought independent oversight before committing to another remediation attempt.",
      challenges: [
        "Three prior remediation attempts by different contractors, none fully documented",
        "No baseline environmental testing existed from prior work",
        "Active microbial growth discovered behind recently installed finishes",
        "Homeowner\u2019s trust in contractor recommendations was understandably low",
      ],
      approach: "We established a documentation baseline that should have existed from the first remediation. Independent testing confirmed active growth in areas the prior contractors had certified as clear. A new scope was developed from scratch, and a different vendor was selected through our curated process.",
      result: "Root cause identified as a construction detailing error in the building envelope. Remediation addressed both the contamination and the entry point. Post-remediation testing confirmed clearance, and the homeowner received documentation sufficient for disclosure and insurance purposes.",
    },
  },
  {
    id: "beverly-hills",
    area: "Beverly Hills, CA",
    scale: "Luxury residential",
    concern: "Asbestos + build-back coordination",
    role: "Reviewed environmental documentation and coordinated specialist involvement before construction.",
    outcome:
      "Safer sequencing and clean separation between remediation and reconstruction.",
    detail: {
      overview: "A luxury residential renovation in Beverly Hills encountered asbestos-containing materials during demolition. The general contractor had not commissioned an environmental survey prior to breaking ground. Work was halted, and the homeowner needed independent guidance on how to proceed safely and efficiently.",
      challenges: [
        "Asbestos-containing materials discovered mid-demolition without prior survey",
        "General contractor unfamiliar with abatement coordination requirements",
        "Project timeline pressure from architect and interior designer",
        "Need to ensure safe sequencing between abatement and reconstruction",
      ],
      approach: "We coordinated an emergency environmental survey to map all ACM in the renovation zone. An abatement scope was developed, certified contractors were brought in, and work was sequenced to minimize project delay while maintaining full regulatory compliance. Air monitoring was conducted throughout.",
      result: "Abatement completed in 10 days. Clearance testing passed on first attempt. The renovation resumed with a clear environmental baseline, and the homeowner received documentation protecting them from future liability. Total project delay: 3 weeks versus the 8+ weeks estimated without coordinated response.",
    },
  },
  {
    id: "brentwood",
    area: "Brentwood, CA",
    scale: "High-value family res.",
    concern: "Smoke / fire-related contamination",
    role: "Organized reports, reviewed vendor proposals, and translated findings into practical decisions.",
    outcome:
      "A clearer path toward remediation, cleaning, and closeout.",
    detail: {
      overview: "Following a nearby wildfire, a high-value family residence in Brentwood showed no visible fire damage but had significant smoke infiltration through the HVAC system and building envelope. The insurance carrier\u2019s initial remediation estimate covered surface cleaning only. The family, including young children, needed independent assessment of the actual contamination extent.",
      challenges: [
        "No visible damage but pervasive smoke odor throughout the property",
        "HVAC system had operated during the fire event, distributing particulates",
        "Insurance estimate covered surface cleaning but not system remediation",
        "Family with young children needed safe re-occupancy assurance",
      ],
      approach: "Comprehensive air quality testing revealed elevated particulate and VOC levels throughout the home, with the highest concentrations in the HVAC system and soft furnishings. We developed an independent scope that included duct cleaning, soft material replacement, and HEPA filtration, then negotiated with the insurance carrier using our documented findings.",
      result: "The insurance carrier approved a revised scope at 2.8x the original estimate based on our independent documentation. The family relocated temporarily during remediation. Post-remediation testing confirmed all zones met residential air quality standards before re-occupancy.",
    },
  },
];

/* ─── Founders ─── */
export interface Founder {
  name: string;
  initial: string;
  title: string;
  quote: string;
  portraitPosition?: string;
}

export const FOUNDERS: Founder[] = [
  {
    name: "Stephen",
    initial: "S",
    title: "CO-FOUNDER",
    quote:
      "I was born in Malibu. I\u2019ve lost my house to fire twice in my lifetime. I\u2019m not advising from the comfortable other side of the experience\u2009\u2014\u2009I\u2019m in the middle of it. Same as a lot of my neighbors. When somebody walks back onto their property and a stranger in a hard hat hands them a clipboard and a number, they deserve somebody on their side who has actually stood where they\u2019re standing. I have. I still am.",
  },
  {
    name: "Roman",
    initial: "R",
    title: "CO-FOUNDER",
    portraitPosition: "center 15%",
    quote:
      "I arrived in Santa Monica in 2010 and never really left. Then the fires came, and it all became too personal. Friends lost houses. My daughter\u2019s school was in ashes. You can\u2019t pretend, after that, that you\u2019re doing this work for anyone but the people living it. I oversee construction across LA every day\u2009\u2014\u2009I see how corners get cut and how the homeowner is left with the consequences. It\u2019s why we started this. Not someday. Now.",
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
      { label: "Client Office", href: "/portal" },
      { label: "For Estate Managers", href: "#contact" },
      { label: "For Counsel + Advisors", href: "#contact" },
    ],
  },
  {
    heading: "Legal",
    items: [
      { label: "Privacy Notice", href: "/privacy" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "NDA Sample", href: "/nda" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
];

/* ── WIP page stubs ── */
export const OWNER_SIDE_POINTS: string[] = [];
export const INSIGHTS: unknown[] = [];
export const ADVISORY_SERVICES: unknown[] = [];
export const FIRM_DISCLAIMER = "";
export const PROCESS_STEPS: unknown[] = [];
