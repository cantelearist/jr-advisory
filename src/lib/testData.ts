/* ─── JR Advisory — Test Database ─── */
/* Client-side mock database with localStorage persistence + reset capability */

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  property: string;
  area: string;
  status: "active" | "pending" | "completed";
  createdAt: string;
}

export interface Engagement {
  id: string;
  clientId: string;
  type: string;
  phase: 1 | 2 | 3 | 4;
  phaseLabel: string;
  startDate: string;
  nextMilestone: string;
  property: string;
  notes: string;
}

export interface DocRecord {
  id: string;
  clientId: string;
  engagementId: string;
  name: string;
  category: "nda" | "lab-results" | "proposals" | "clearance" | "invoices" | "reports";
  status: "final" | "draft" | "pending-review";
  date: string;
  size: string;
}

export interface Message {
  id: string;
  clientId: string;
  engagementId: string;
  from: "firm" | "client";
  sender: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  encrypted: boolean;
}

export interface TimelineEvent {
  id: string;
  engagementId: string;
  phase: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  date: string;
  type: "milestone" | "document" | "meeting" | "update";
}

/* ── Seed Data ── */

export const SEED_CLIENTS: Client[] = [
  {
    id: "cli_001",
    name: "Alexandra Whitfield",
    email: "a.whitfield@proton.me",
    phone: "+1 (310) 555-0142",
    property: "1247 Pacific Coast Highway, Malibu",
    area: "Malibu",
    status: "active",
    createdAt: "2026-03-14",
  },
  {
    id: "cli_002",
    name: "Jonathan Mercer",
    email: "jmercer@signal.org",
    phone: "+1 (310) 555-0287",
    property: "842 Stone Canyon Road, Bel Air",
    area: "Bel Air",
    status: "active",
    createdAt: "2026-02-01",
  },
  {
    id: "cli_003",
    name: "Catherine & David Park",
    email: "parkfamily@proton.me",
    phone: "+1 (310) 555-0391",
    property: "1560 San Remo Drive, Pacific Palisades",
    area: "Pacific Palisades",
    status: "active",
    createdAt: "2026-04-02",
  },
  {
    id: "cli_004",
    name: "Robert Harrington III",
    email: "rh3@proton.me",
    phone: "+1 (310) 555-0455",
    property: "9100 Wilshire Blvd Penthouse, Beverly Hills",
    area: "Beverly Hills",
    status: "completed",
    createdAt: "2025-11-15",
  },
  {
    id: "cli_005",
    name: "Sofia Nakamura",
    email: "s.nakamura@signal.org",
    phone: "+1 (310) 555-0512",
    property: "224 Adelaide Drive, Santa Monica",
    area: "Santa Monica",
    status: "pending",
    createdAt: "2026-05-10",
  },
];

export const SEED_ENGAGEMENTS: Engagement[] = [
  {
    id: "eng_001",
    clientId: "cli_001",
    type: "Mold & Water Intrusion",
    phase: 3,
    phaseLabel: "Scope & Vendor Curation",
    startDate: "March 14, 2026",
    nextMilestone: "Vendor shortlist presentation — May 22",
    property: "1247 Pacific Coast Highway, Malibu",
    notes: "Initial moisture mapping complete. Three vendors under review.",
  },
  {
    id: "eng_002",
    clientId: "cli_002",
    type: "Asbestos & Legacy Materials",
    phase: 2,
    phaseLabel: "Independent Assessment",
    startDate: "February 1, 2026",
    nextMilestone: "Survey results — May 19",
    property: "842 Stone Canyon Road, Bel Air",
    notes: "Pre-1965 estate. Full survey underway. Family relocated during assessment.",
  },
  {
    id: "eng_003",
    clientId: "cli_003",
    type: "Fire & Smoke Residue",
    phase: 1,
    phaseLabel: "Confidential Consultation",
    startDate: "April 2, 2026",
    nextMilestone: "Walk-through scheduled — May 20",
    property: "1560 San Remo Drive, Pacific Palisades",
    notes: "Post-Palisades fire. Initial consultation complete. NDA signed.",
  },
  {
    id: "eng_004",
    clientId: "cli_004",
    type: "Indoor Air Quality & VOCs",
    phase: 4,
    phaseLabel: "Oversight & Clearance",
    startDate: "November 15, 2025",
    nextMilestone: "Final clearance testing — May 25",
    property: "9100 Wilshire Blvd Penthouse, Beverly Hills",
    notes: "Remediation complete. Awaiting final clearance verification.",
  },
  {
    id: "eng_005",
    clientId: "cli_005",
    type: "Pre-Purchase Diligence",
    phase: 1,
    phaseLabel: "Confidential Consultation",
    startDate: "May 10, 2026",
    nextMilestone: "Initial property review — May 23",
    property: "224 Adelaide Drive, Santa Monica",
    notes: "Prospective buyer. Environmental review before acquisition.",
  },
];

export const SEED_DOCUMENTS: DocRecord[] = [
  // Engagement 1 - Whitfield
  { id: "doc_001", clientId: "cli_001", engagementId: "eng_001", name: "Mutual NDA — Whitfield", category: "nda", status: "final", date: "2026-03-14", size: "245 KB" },
  { id: "doc_002", clientId: "cli_001", engagementId: "eng_001", name: "Moisture Mapping Report", category: "lab-results", status: "final", date: "2026-03-28", size: "1.8 MB" },
  { id: "doc_003", clientId: "cli_001", engagementId: "eng_001", name: "IEP Lab Results — Mold Panel", category: "lab-results", status: "final", date: "2026-04-05", size: "3.2 MB" },
  { id: "doc_004", clientId: "cli_001", engagementId: "eng_001", name: "Vendor Proposal — Pacific Remediation", category: "proposals", status: "pending-review", date: "2026-05-01", size: "890 KB" },
  { id: "doc_005", clientId: "cli_001", engagementId: "eng_001", name: "Vendor Proposal — Westside Environmental", category: "proposals", status: "pending-review", date: "2026-05-03", size: "1.1 MB" },
  { id: "doc_006", clientId: "cli_001", engagementId: "eng_001", name: "Scope of Work — Draft", category: "proposals", status: "draft", date: "2026-05-10", size: "420 KB" },
  // Engagement 2 - Mercer
  { id: "doc_007", clientId: "cli_002", engagementId: "eng_002", name: "Mutual NDA — Mercer", category: "nda", status: "final", date: "2026-02-01", size: "245 KB" },
  { id: "doc_008", clientId: "cli_002", engagementId: "eng_002", name: "Asbestos Survey — Building A", category: "lab-results", status: "final", date: "2026-03-15", size: "4.5 MB" },
  { id: "doc_009", clientId: "cli_002", engagementId: "eng_002", name: "Material Sample Analysis", category: "lab-results", status: "pending-review", date: "2026-05-12", size: "2.1 MB" },
  // Engagement 3 - Park
  { id: "doc_010", clientId: "cli_003", engagementId: "eng_003", name: "Mutual NDA — Park Family", category: "nda", status: "final", date: "2026-04-02", size: "248 KB" },
  { id: "doc_011", clientId: "cli_003", engagementId: "eng_003", name: "Preliminary Site Photos", category: "reports", status: "final", date: "2026-04-10", size: "12.4 MB" },
  // Engagement 4 - Harrington
  { id: "doc_012", clientId: "cli_004", engagementId: "eng_004", name: "Final Clearance Report", category: "clearance", status: "draft", date: "2026-05-15", size: "2.8 MB" },
  { id: "doc_013", clientId: "cli_004", engagementId: "eng_004", name: "Invoice — Q1 2026", category: "invoices", status: "final", date: "2026-04-01", size: "180 KB" },
  { id: "doc_014", clientId: "cli_004", engagementId: "eng_004", name: "Invoice — Q2 2026", category: "invoices", status: "pending-review", date: "2026-05-01", size: "195 KB" },
];

export const SEED_MESSAGES: Message[] = [
  // Whitfield thread
  { id: "msg_001", clientId: "cli_001", engagementId: "eng_001", from: "firm", sender: "Roman", subject: "Welcome to Your Office", body: "Alexandra — your private project space is ready. All engagement documents, status updates, and communications will be accessible here. You'll receive notifications via your Proton address when new items are posted.\n\nPlease review the moisture mapping report at your earliest convenience.", date: "2026-03-14T10:00:00", read: true, encrypted: true },
  { id: "msg_002", clientId: "cli_001", engagementId: "eng_001", from: "client", sender: "Alexandra Whitfield", subject: "Re: Welcome to Your Office", body: "Roman, thank you. I've reviewed the moisture mapping report. The readings in the west wing are concerning — can we discuss the implications before moving to vendor selection?", date: "2026-03-15T14:30:00", read: true, encrypted: true },
  { id: "msg_003", clientId: "cli_001", engagementId: "eng_001", from: "firm", sender: "Steven", subject: "West Wing Assessment", body: "Alexandra — I walked the west wing yesterday. The elevated readings are consistent with the roof junction we flagged during initial inspection. I've updated the assessment with photos and a detailed moisture map overlay. The good news: it's contained to the junction area, not systemic. This gives us leverage in vendor negotiations.\n\nI'll have the updated scope by end of week.", date: "2026-03-18T09:15:00", read: true, encrypted: true },
  { id: "msg_004", clientId: "cli_001", engagementId: "eng_001", from: "firm", sender: "Roman", subject: "Vendor Proposals Ready", body: "Two proposals are now in your document vault: Pacific Remediation and Westside Environmental. I've reviewed both — my annotated comparison will follow tomorrow. Key difference: Pacific proposes full containment, Westside suggests phased. My recommendation will be in the comparison document.", date: "2026-05-03T11:00:00", read: false, encrypted: true },
  // Mercer thread
  { id: "msg_005", clientId: "cli_002", engagementId: "eng_002", from: "firm", sender: "Roman", subject: "Survey Progress Update", body: "Jonathan — Building A survey is complete. Results are in your vault. Building B begins next week. The family should plan to remain at the guest house through the end of May.", date: "2026-03-16T16:00:00", read: true, encrypted: true },
  { id: "msg_006", clientId: "cli_002", engagementId: "eng_002", from: "client", sender: "Jonathan Mercer", subject: "Re: Survey Progress", body: "Understood. What should we expect from the Building B survey? Any areas of particular concern based on A?", date: "2026-03-17T08:45:00", read: true, encrypted: true },
  // Park thread
  { id: "msg_007", clientId: "cli_003", engagementId: "eng_003", from: "firm", sender: "Steven", subject: "Walk-Through Confirmation", body: "Catherine, David — confirming the walk-through for May 20 at 9 AM. I'll bring our documentation kit. Please ensure the property is accessible (alarm codes, gate access). We'll need approximately 3 hours for the initial survey.\n\nAs discussed, all findings will be under the standing NDA.", date: "2026-05-15T10:00:00", read: false, encrypted: true },
];

export const SEED_TIMELINE: TimelineEvent[] = [
  // Whitfield timeline
  { id: "tl_001", engagementId: "eng_001", phase: 1, title: "Engagement Accepted", description: "Confidential consultation completed. NDA signed. Engagement letter executed.", date: "2026-03-14", type: "milestone" },
  { id: "tl_002", engagementId: "eng_001", phase: 1, title: "Initial Walk-Through", description: "On-site inspection of the property. Noted visible water damage in west wing, potential mold behind drywall.", date: "2026-03-16", type: "meeting" },
  { id: "tl_003", engagementId: "eng_001", phase: 2, title: "Phase II Commenced", description: "Independent assessment phase. Coordinating IEP and moisture mapping specialists.", date: "2026-03-20", type: "milestone" },
  { id: "tl_004", engagementId: "eng_001", phase: 2, title: "Moisture Mapping Complete", description: "Full property moisture map generated. Elevated readings isolated to west wing roof junction.", date: "2026-03-28", type: "document" },
  { id: "tl_005", engagementId: "eng_001", phase: 2, title: "Lab Results Received", description: "IEP mold panel confirms Stachybotrys in west wing samples. Report uploaded to vault.", date: "2026-04-05", type: "document" },
  { id: "tl_006", engagementId: "eng_001", phase: 3, title: "Phase III Commenced", description: "Scope & vendor curation phase. Preparing written scope and vendor shortlist.", date: "2026-04-15", type: "milestone" },
  { id: "tl_007", engagementId: "eng_001", phase: 3, title: "Vendor Proposals Received", description: "Two proposals received: Pacific Remediation (full containment) and Westside Environmental (phased approach).", date: "2026-05-03", type: "document" },
  { id: "tl_008", engagementId: "eng_001", phase: 3, title: "Scope of Work — Draft", description: "Draft scope document prepared for client review before vendor selection.", date: "2026-05-10", type: "update" },
  // Mercer timeline
  { id: "tl_009", engagementId: "eng_002", phase: 1, title: "Engagement Accepted", description: "Pre-1965 estate. Full asbestos survey required before planned renovation.", date: "2026-02-01", type: "milestone" },
  { id: "tl_010", engagementId: "eng_002", phase: 2, title: "Building A Survey Complete", description: "Asbestos-containing materials identified in flooring, pipe insulation, and ceiling tiles.", date: "2026-03-15", type: "document" },
  { id: "tl_011", engagementId: "eng_002", phase: 2, title: "Material Samples Submitted", description: "Additional samples from Building B sent to laboratory for analysis.", date: "2026-05-12", type: "document" },
];

/* ── Database Manager ── */

const DB_KEY = "jr_advisory_test_db";

export interface TestDatabase {
  clients: Client[];
  engagements: Engagement[];
  documents: DocRecord[];
  messages: Message[];
  timeline: TimelineEvent[];
  lastReset: string;
}

export function getDatabase(): TestDatabase {
  if (typeof window === "undefined") {
    return createFreshDatabase();
  }
  const stored = localStorage.getItem(DB_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return createFreshDatabase();
    }
  }
  const fresh = createFreshDatabase();
  localStorage.setItem(DB_KEY, JSON.stringify(fresh));
  return fresh;
}

export function saveDatabase(db: TestDatabase): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }
}

export function resetDatabase(): TestDatabase {
  const fresh = createFreshDatabase();
  if (typeof window !== "undefined") {
    localStorage.setItem(DB_KEY, JSON.stringify(fresh));
  }
  return fresh;
}

function createFreshDatabase(): TestDatabase {
  return {
    clients: [...SEED_CLIENTS],
    engagements: [...SEED_ENGAGEMENTS],
    documents: [...SEED_DOCUMENTS],
    messages: [...SEED_MESSAGES],
    timeline: [...SEED_TIMELINE],
    lastReset: new Date().toISOString(),
  };
}

/* ── Query helpers ── */

export function getClientEngagement(clientId: string): Engagement | undefined {
  const db = getDatabase();
  return db.engagements.find((e) => e.clientId === clientId);
}

export function getClientDocuments(clientId: string): DocRecord[] {
  const db = getDatabase();
  return db.documents.filter((d) => d.clientId === clientId);
}

export function getClientMessages(clientId: string): Message[] {
  const db = getDatabase();
  return db.messages.filter((m) => m.clientId === clientId);
}

export function getEngagementTimeline(engagementId: string): TimelineEvent[] {
  const db = getDatabase();
  return db.timeline.filter((t) => t.engagementId === engagementId);
}
