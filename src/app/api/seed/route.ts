/* ── POST /api/seed — Populate Supabase with rich test data ── */
/* Each client has a different project stage, invoices (paid/outstanding), messages, timeline, documents */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function adminClient() {
  if (!supabaseUrl || !serviceKey) throw new Error('Supabase env vars missing');
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/* ── Deterministic UUIDs (valid v4 format: 8-4-4-4-12) ── */
const pad = (n: number) => String(n).padStart(4, '0');
const C = (n: number) => `c0000000-c000-4000-a000-00000000${pad(n)}`; // clients
const E = (n: number) => `e0000000-e000-4000-a000-00000000${pad(n)}`; // engagements
const D = (n: number) => `d0000000-d000-4000-a000-00000000${pad(n)}`; // documents
const M = (n: number) => `f0000000-f000-4000-a000-00000000${pad(n)}`; // messages
const T = (n: number) => `a0000000-a000-4000-a000-00000000${pad(n)}`; // timeline
const I = (n: number) => `b0000000-b000-4000-a000-00000000${pad(n)}`; // invoices
const N = (n: number) => `11000000-1100-4000-a000-00000000${pad(n)}`; // ndas
const TD = (n: number) => `b0000000-b000-4000-a000-00000000${pad(n)}`; // todos

export async function POST(request: Request) {
  try {
    /* Auth check — require secret or service key match */
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (key !== 'jr-seed-2026' && key !== serviceKey.slice(0, 12)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sb = adminClient();

    /* ── Wipe existing data (order matters for FK) ── */
    await sb.from('todos').delete().not('id', 'is', null);
    await sb.from('audit_log').delete().not('id', 'is', null);
    await sb.from('nda_records').delete().not('id', 'is', null);
    await sb.from('timeline_events').delete().not('id', 'is', null);
    await sb.from('messages').delete().not('id', 'is', null);
    await sb.from('documents').delete().not('id', 'is', null);
    await sb.from('invoices').delete().not('id', 'is', null);
    await sb.from('engagements').delete().not('id', 'is', null);
    await sb.from('clients').delete().not('id', 'is', null);

    /* ════════════════════════════════════════════════
       CLIENTS — 5 clients, each at a different stage
       ════════════════════════════════════════════════ */
    const clients = [
      {
        id: C(1),
        name: 'Alexandra Whitfield',
        email: 'a.whitfield@proton.me',
        phone: '+1 (310) 555-0142',
        property: '1247 Pacific Coast Highway, Malibu',
        area: 'Malibu',
        status: 'active',
        notes: 'High-profile client. Referred by estate manager. Prefers encrypted communications only.',
        created_at: '2026-03-14T08:00:00Z',
      },
      {
        id: C(2),
        name: 'Jonathan Mercer',
        email: 'jmercer@signal.org',
        phone: '+1 (310) 555-0287',
        property: '842 Stone Canyon Road, Bel Air',
        area: 'Bel Air',
        status: 'active',
        notes: 'Pre-1965 estate. Full asbestos survey required before planned renovation. Family relocated.',
        created_at: '2026-02-01T08:00:00Z',
      },
      {
        id: C(3),
        name: 'Catherine & David Park',
        email: 'parkfamily@proton.me',
        phone: '+1 (310) 555-0391',
        property: '1560 San Remo Drive, Pacific Palisades',
        area: 'Pacific Palisades',
        status: 'active',
        notes: 'Post-Palisades fire. Dual-party client. NDA signed. Property severely impacted.',
        created_at: '2026-04-02T08:00:00Z',
      },
      {
        id: C(4),
        name: 'Robert Harrington III',
        email: 'rh3@proton.me',
        phone: '+1 (310) 555-0455',
        property: '9100 Wilshire Blvd Penthouse, Beverly Hills',
        area: 'Beverly Hills',
        status: 'completed',
        notes: 'Engagement complete. Final clearance issued. Full payment received.',
        created_at: '2025-11-15T08:00:00Z',
      },
      {
        id: C(5),
        name: 'Sofia Nakamura',
        email: 's.nakamura@signal.org',
        phone: '+1 (310) 555-0512',
        property: '224 Adelaide Drive, Santa Monica',
        area: 'Santa Monica',
        status: 'pending',
        notes: 'Prospective buyer. Environmental review before acquisition. Introduced by attorney.',
        created_at: '2026-05-10T08:00:00Z',
      },
    ];

    const { error: cErr } = await sb.from('clients').insert(clients);
    if (cErr) throw new Error(`clients: ${cErr.message}`);

    /* ════════════════════════════════════════════════
       ENGAGEMENTS — different phases per client
       ════════════════════════════════════════════════ */
    const engagements = [
      {
        id: E(1),
        client_id: C(1),
        type: 'Mold & Water Intrusion',
        phase: '3',
        phase_label: 'Scope & Vendor Curation',
        start_date: '2026-03-14',
        next_milestone: 'Vendor shortlist presentation — May 28',
        property: '1247 Pacific Coast Highway, Malibu',
        notes: 'Initial moisture mapping complete. Three vendors under review. Client prefers phased approach.',
      },
      {
        id: E(2),
        client_id: C(2),
        type: 'Asbestos & Legacy Materials',
        phase: '2',
        phase_label: 'Independent Assessment',
        start_date: '2026-02-01',
        next_milestone: 'Building B survey results — May 30',
        property: '842 Stone Canyon Road, Bel Air',
        notes: 'Pre-1965 estate. Building A complete, Building B in progress. Family relocated to guest house.',
      },
      {
        id: E(3),
        client_id: C(3),
        type: 'Fire & Smoke Residue',
        phase: '1',
        phase_label: 'Confidential Consultation',
        start_date: '2026-04-02',
        next_milestone: 'Walk-through scheduled — May 26',
        property: '1560 San Remo Drive, Pacific Palisades',
        notes: 'Post-Palisades fire. Initial consultation complete. NDA signed. Awaiting site walk-through.',
      },
      {
        id: E(4),
        client_id: C(4),
        type: 'Indoor Air Quality & VOCs',
        phase: '4',
        phase_label: 'Oversight & Clearance',
        start_date: '2025-11-15',
        next_milestone: 'Engagement complete',
        property: '9100 Wilshire Blvd Penthouse, Beverly Hills',
        notes: 'Remediation complete. Final clearance verification passed. Project closed successfully.',
      },
      {
        id: E(5),
        client_id: C(5),
        type: 'Pre-Purchase Diligence',
        phase: '1',
        phase_label: 'Confidential Consultation',
        start_date: '2026-05-10',
        next_milestone: 'Initial property review — May 27',
        property: '224 Adelaide Drive, Santa Monica',
        notes: 'Prospective buyer seeking environmental due diligence before $8.2M acquisition.',
      },
    ];

    const { error: eErr } = await sb.from('engagements').insert(engagements);
    if (eErr) throw new Error(`engagements: ${eErr.message}`);

    /* ════════════════════════════════════════════════
       DOCUMENTS — varied categories and statuses
       ════════════════════════════════════════════════ */
    const documents = [
      // Whitfield (Phase 3 — extensive docs)
      { id: D(1),  client_id: C(1), engagement_id: E(1), name: 'Mutual NDA — Whitfield',                  category: 'nda',          status: 'final',          file_size: '245 KB',  created_at: '2026-03-14T10:00:00Z' },
      { id: D(2),  client_id: C(1), engagement_id: E(1), name: 'Moisture Mapping Report',                  category: 'lab-results',  status: 'final',          file_size: '1.8 MB',  created_at: '2026-03-28T14:00:00Z' },
      { id: D(3),  client_id: C(1), engagement_id: E(1), name: 'IEP Lab Results — Mold Panel',             category: 'lab-results',  status: 'final',          file_size: '3.2 MB',  created_at: '2026-04-05T11:30:00Z' },
      { id: D(4),  client_id: C(1), engagement_id: E(1), name: 'Vendor Proposal — Pacific Remediation',    category: 'proposals',    status: 'pending-review',  file_size: '890 KB',  created_at: '2026-05-01T09:00:00Z' },
      { id: D(5),  client_id: C(1), engagement_id: E(1), name: 'Vendor Proposal — Westside Environmental', category: 'proposals',    status: 'pending-review',  file_size: '1.1 MB',  created_at: '2026-05-03T15:00:00Z' },
      { id: D(6),  client_id: C(1), engagement_id: E(1), name: 'Vendor Proposal — Coastal Environmental',  category: 'proposals',    status: 'pending-review',  file_size: '920 KB',  created_at: '2026-05-05T10:00:00Z' },
      { id: D(7),  client_id: C(1), engagement_id: E(1), name: 'Scope of Work — Draft',                    category: 'proposals',    status: 'draft',           file_size: '420 KB',  created_at: '2026-05-10T16:00:00Z' },
      // Mercer (Phase 2 — assessment docs)
      { id: D(8),  client_id: C(2), engagement_id: E(2), name: 'Mutual NDA — Mercer',                      category: 'nda',          status: 'final',          file_size: '245 KB',  created_at: '2026-02-01T10:00:00Z' },
      { id: D(9),  client_id: C(2), engagement_id: E(2), name: 'Asbestos Survey — Building A',             category: 'lab-results',  status: 'final',          file_size: '4.5 MB',  created_at: '2026-03-15T14:00:00Z' },
      { id: D(10), client_id: C(2), engagement_id: E(2), name: 'Material Sample Analysis',                 category: 'lab-results',  status: 'pending-review',  file_size: '2.1 MB',  created_at: '2026-05-12T11:00:00Z' },
      { id: D(11), client_id: C(2), engagement_id: E(2), name: 'Site Assessment Report — Preliminary',     category: 'reports',      status: 'final',          file_size: '5.7 MB',  created_at: '2026-02-20T09:00:00Z' },
      // Park (Phase 1 — early docs)
      { id: D(12), client_id: C(3), engagement_id: E(3), name: 'Mutual NDA — Park Family',                 category: 'nda',          status: 'final',          file_size: '248 KB',  created_at: '2026-04-02T10:00:00Z' },
      { id: D(13), client_id: C(3), engagement_id: E(3), name: 'Preliminary Site Photos',                  category: 'reports',      status: 'final',          file_size: '12.4 MB', created_at: '2026-04-10T14:00:00Z' },
      { id: D(14), client_id: C(3), engagement_id: E(3), name: 'Fire Damage Assessment — Initial',         category: 'reports',      status: 'draft',          file_size: '3.1 MB',  created_at: '2026-05-18T10:00:00Z' },
      // Harrington (Phase 4 — complete, lots of docs)
      { id: D(15), client_id: C(4), engagement_id: E(4), name: 'Mutual NDA — Harrington',                  category: 'nda',          status: 'final',          file_size: '245 KB',  created_at: '2025-11-15T10:00:00Z' },
      { id: D(16), client_id: C(4), engagement_id: E(4), name: 'Air Quality Baseline Report',              category: 'lab-results',  status: 'final',          file_size: '2.8 MB',  created_at: '2025-12-10T14:00:00Z' },
      { id: D(17), client_id: C(4), engagement_id: E(4), name: 'VOC Source Identification',                category: 'lab-results',  status: 'final',          file_size: '1.9 MB',  created_at: '2026-01-15T11:00:00Z' },
      { id: D(18), client_id: C(4), engagement_id: E(4), name: 'Remediation Scope — Final',                category: 'proposals',    status: 'final',          file_size: '680 KB',  created_at: '2026-02-01T09:00:00Z' },
      { id: D(19), client_id: C(4), engagement_id: E(4), name: 'Final Clearance Report',                   category: 'clearance',    status: 'final',          file_size: '2.8 MB',  created_at: '2026-05-15T16:00:00Z' },
      { id: D(20), client_id: C(4), engagement_id: E(4), name: 'Post-Remediation Air Quality Certificate', category: 'clearance',    status: 'final',          file_size: '340 KB',  created_at: '2026-05-18T10:00:00Z' },
      // Nakamura (Phase 1 — minimal docs)
      { id: D(21), client_id: C(5), engagement_id: E(5), name: 'Mutual NDA — Nakamura',                    category: 'nda',          status: 'final',          file_size: '245 KB',  created_at: '2026-05-10T10:00:00Z' },
      { id: D(22), client_id: C(5), engagement_id: E(5), name: 'Property Listing & Disclosures',           category: 'reports',      status: 'pending-review',  file_size: '8.2 MB',  created_at: '2026-05-14T14:00:00Z' },
    ];

    const { error: dErr } = await sb.from('documents').insert(documents);
    if (dErr) throw new Error(`documents: ${dErr.message}`);

    /* ════════════════════════════════════════════════
       INVOICES — varied statuses (paid, sent, overdue, draft)
       ════════════════════════════════════════════════ */
    const invoices = [
      // Whitfield — retainer paid, Phase 3 sent
      { id: I(1), client_id: C(1), engagement_id: E(1), invoice_number: 'JRA-2026-001', description: 'Initial Retainer — Consultation & Assessment',          amount: 7500,  status: 'paid',    due_date: '2026-03-28', paid_date: '2026-03-25', notes: 'Wire transfer received' },
      { id: I(2), client_id: C(1), engagement_id: E(1), invoice_number: 'JRA-2026-002', description: 'Phase II — Independent Assessment & Lab Analysis',       amount: 12500, status: 'paid',    due_date: '2026-04-30', paid_date: '2026-04-28', notes: 'Wire transfer received' },
      { id: I(3), client_id: C(1), engagement_id: E(1), invoice_number: 'JRA-2026-006', description: 'Phase III — Scope & Vendor Curation',                    amount: 8500,  status: 'sent',    due_date: '2026-06-01', paid_date: null,          notes: 'Sent May 15' },
      // Mercer — retainer paid, assessment ongoing
      { id: I(4), client_id: C(2), engagement_id: E(2), invoice_number: 'JRA-2026-003', description: 'Initial Retainer — Consultation & Site Survey',           amount: 15000, status: 'paid',    due_date: '2026-02-15', paid_date: '2026-02-12', notes: 'Check received' },
      { id: I(5), client_id: C(2), engagement_id: E(2), invoice_number: 'JRA-2026-007', description: 'Phase II — Asbestos Assessment (Buildings A & B)',        amount: 22000, status: 'sent',    due_date: '2026-05-30', paid_date: null,          notes: 'Complex survey, multiple buildings' },
      // Park — retainer paid
      { id: I(6), client_id: C(3), engagement_id: E(3), invoice_number: 'JRA-2026-004', description: 'Initial Retainer — Confidential Consultation',            amount: 5000,  status: 'paid',    due_date: '2026-04-15', paid_date: '2026-04-14', notes: 'Wire transfer' },
      // Harrington — all paid (completed engagement)
      { id: I(7),  client_id: C(4), engagement_id: E(4), invoice_number: 'JRA-2025-008', description: 'Initial Retainer — Air Quality Assessment',              amount: 10000, status: 'paid',    due_date: '2025-12-01', paid_date: '2025-11-28', notes: 'Wire transfer' },
      { id: I(8),  client_id: C(4), engagement_id: E(4), invoice_number: 'JRA-2026-009', description: 'Phase II — Source Identification & Lab Work',            amount: 18000, status: 'paid',    due_date: '2026-01-30', paid_date: '2026-01-28', notes: 'Wire transfer' },
      { id: I(9),  client_id: C(4), engagement_id: E(4), invoice_number: 'JRA-2026-010', description: 'Phase III — Remediation Scope & Vendor Oversight',       amount: 14000, status: 'paid',    due_date: '2026-03-15', paid_date: '2026-03-12', notes: 'Wire transfer' },
      { id: I(10), client_id: C(4), engagement_id: E(4), invoice_number: 'JRA-2026-011', description: 'Phase IV — Final Oversight & Clearance Verification',    amount: 8500,  status: 'paid',    due_date: '2026-05-20', paid_date: '2026-05-18', notes: 'Final invoice — engagement closed' },
      // Nakamura — retainer draft (pending engagement acceptance)
      { id: I(11), client_id: C(5), engagement_id: E(5), invoice_number: 'JRA-2026-012', description: 'Initial Retainer — Pre-Purchase Environmental Diligence', amount: 6000,  status: 'draft',   due_date: '2026-05-30', paid_date: null,          notes: 'Pending formal engagement acceptance' },
    ];

    const { error: iErr } = await sb.from('invoices').insert(invoices);
    if (iErr) throw new Error(`invoices: ${iErr.message}`);

    /* ════════════════════════════════════════════════
       MESSAGES — realistic back-and-forth per engagement
       ════════════════════════════════════════════════ */
    const messages = [
      // ── Whitfield thread (Phase 3 — active conversation) ──
      { id: M(1),  client_id: C(1), engagement_id: E(1), sender_type: 'firm',   sender_name: 'Roman',                subject: 'Welcome to Your Office',         body: 'Alexandra — your private project space is ready. All engagement documents, status updates, and communications will be accessible here. You\'ll receive notifications via your Proton address when new items are posted.\n\nPlease review the moisture mapping report at your earliest convenience.', read: true,  encrypted: true,  created_at: '2026-03-14T10:00:00Z' },
      { id: M(2),  client_id: C(1), engagement_id: E(1), sender_type: 'client', sender_name: 'Alexandra Whitfield',  subject: 'Re: Welcome to Your Office',     body: 'Roman, thank you. I\'ve reviewed the moisture mapping report. The readings in the west wing are concerning — can we discuss the implications before moving to vendor selection?', read: true,  encrypted: true,  created_at: '2026-03-15T14:30:00Z' },
      { id: M(3),  client_id: C(1), engagement_id: E(1), sender_type: 'firm',   sender_name: 'Stephen',              subject: 'West Wing Assessment',           body: 'Alexandra — I walked the west wing yesterday. The elevated readings are consistent with the roof junction we flagged during initial inspection. I\'ve updated the assessment with photos and a detailed moisture map overlay. The good news: it\'s contained to the junction area, not systemic. This gives us leverage in vendor negotiations.\n\nI\'ll have the updated scope by end of week.', read: true,  encrypted: true,  created_at: '2026-03-18T09:15:00Z' },
      { id: M(4),  client_id: C(1), engagement_id: E(1), sender_type: 'client', sender_name: 'Alexandra Whitfield',  subject: 'Re: West Wing Assessment',       body: 'Stephen, that\'s reassuring. The containment to the junction area is good news. I\'d like to see the vendor comparison when it\'s ready. My estate manager can coordinate access for any follow-up inspections.', read: true,  encrypted: true,  created_at: '2026-03-19T11:00:00Z' },
      { id: M(5),  client_id: C(1), engagement_id: E(1), sender_type: 'firm',   sender_name: 'Roman',                subject: 'Vendor Proposals Ready',         body: 'Three proposals are now in your document vault: Pacific Remediation, Westside Environmental, and Coastal Environmental. I\'ve reviewed all three — my annotated comparison will follow tomorrow.\n\nKey differences: Pacific proposes full containment (conservative), Westside suggests phased (cost-effective), Coastal proposes targeted remediation (fastest). My recommendation will be in the comparison document.', read: false, encrypted: true,  created_at: '2026-05-05T11:00:00Z' },
      { id: M(6),  client_id: C(1), engagement_id: E(1), sender_type: 'firm',   sender_name: 'Roman',                subject: 'Vendor Comparison — Annotated',  body: 'Alexandra — comparison document uploaded. In summary: I recommend the Coastal Environmental targeted approach for your situation. The containment is localized, and their timeline (6 weeks) gets you back to normal fastest.\n\nHappy to walk through this at your convenience. Shall I schedule a call this week?', read: false, encrypted: true,  created_at: '2026-05-06T15:00:00Z' },

      // ── Mercer thread (Phase 2 — survey updates) ──
      { id: M(7),  client_id: C(2), engagement_id: E(2), sender_type: 'firm',   sender_name: 'Roman',                subject: 'Survey Progress Update',         body: 'Jonathan — Building A survey is complete. Results are in your vault. Building B begins next week. The family should plan to remain at the guest house through the end of May.', read: true,  encrypted: true,  created_at: '2026-03-16T16:00:00Z' },
      { id: M(8),  client_id: C(2), engagement_id: E(2), sender_type: 'client', sender_name: 'Jonathan Mercer',      subject: 'Re: Survey Progress',            body: 'Understood. What should we expect from the Building B survey? Any areas of particular concern based on A?', read: true,  encrypted: true,  created_at: '2026-03-17T08:45:00Z' },
      { id: M(9),  client_id: C(2), engagement_id: E(2), sender_type: 'firm',   sender_name: 'Stephen',              subject: 'Building B — What to Expect',    body: 'Jonathan — based on Building A findings, we\'re focusing on three areas in B: the basement mechanical room (pipe insulation), the original kitchen ceiling tiles, and the second-floor library (floor tiles, pre-1965 vintage).\n\nWe\'ll have the lab send results directly to your vault. Timeline: 2 weeks from start of sampling.\n\nOne note: the renovation architect should not begin demolition planning until we have full results. I\'ve communicated this to their office.', read: true,  encrypted: true,  created_at: '2026-03-18T10:30:00Z' },
      { id: M(10), client_id: C(2), engagement_id: E(2), sender_type: 'firm',   sender_name: 'Roman',                subject: 'Material Samples Submitted',     body: 'Building B samples are at the laboratory. Results expected within 10 business days. I\'ll update your vault as soon as they arrive.\n\nPlease note: the pipe insulation samples from the basement were particularly concerning on visual inspection. We\'ll know more when the lab confirms.', read: false, encrypted: true,  created_at: '2026-05-12T14:00:00Z' },

      // ── Park thread (Phase 1 — initial contact) ──
      { id: M(11), client_id: C(3), engagement_id: E(3), sender_type: 'firm',   sender_name: 'Stephen',              subject: 'Walk-Through Confirmation',      body: 'Catherine, David — confirming the walk-through for May 26 at 9 AM. I\'ll bring our documentation kit. Please ensure the property is accessible (alarm codes, gate access). We\'ll need approximately 3 hours for the initial survey.\n\nAs discussed, all findings will be under the standing NDA.', read: false, encrypted: true,  created_at: '2026-05-15T10:00:00Z' },
      { id: M(12), client_id: C(3), engagement_id: E(3), sender_type: 'client', sender_name: 'Catherine Park',       subject: 'Re: Walk-Through Confirmation',  body: 'Stephen — confirmed. Gate code is 4821#. Alarm will be off. The fire damage is primarily in the east wing and garage structure. We haven\'t entered those areas since the fire department cleared the property.\n\nPlease be careful — some of the flooring may be compromised.', read: true,  encrypted: true,  created_at: '2026-05-16T09:00:00Z' },
      { id: M(13), client_id: C(3), engagement_id: E(3), sender_type: 'firm',   sender_name: 'Roman',                subject: 'Pre Walk-Through Note',          body: 'Catherine — thank you for the access details. We\'ll have proper PPE for the fire-damaged areas. After the walk-through, I\'ll prepare a preliminary scope document outlining what testing we recommend.\n\nTypically for post-fire assessments, we\'re looking at: structural ash residue, smoke particulate in HVAC, soil contamination around the structure, and any pre-existing materials (asbestos, lead) that may have been disturbed.\n\nWe\'ll have a clearer picture after Monday.', read: false, encrypted: true,  created_at: '2026-05-17T11:00:00Z' },

      // ── Harrington thread (Phase 4 — closed, complete history) ──
      { id: M(14), client_id: C(4), engagement_id: E(4), sender_type: 'firm',   sender_name: 'Roman',                subject: 'Engagement Complete',            body: 'Robert — pleased to confirm that the final clearance testing has passed. All VOC levels are within OEHHA residential standards. The post-remediation air quality certificate is in your vault.\n\nThis closes our engagement. The final invoice has been settled — thank you for the prompt payment throughout.\n\nIt\'s been a privilege to work on your behalf. If anything arises in the future, we\'re a phone call away.', read: true,  encrypted: true,  created_at: '2026-05-18T16:00:00Z' },
      { id: M(15), client_id: C(4), engagement_id: E(4), sender_type: 'client', sender_name: 'Robert Harrington III', subject: 'Re: Engagement Complete',        body: 'Roman, Stephen — thank you both. The difference between your approach and the contractor\'s initial plan was night and day. The air quality in the penthouse is noticeably better.\n\nI\'ve already mentioned your firm to two colleagues in the building who are dealing with similar issues. You may hear from them.\n\nAll the best.', read: true,  encrypted: true,  created_at: '2026-05-19T09:00:00Z' },

      // ── Nakamura thread (Phase 1 — early) ──
      { id: M(16), client_id: C(5), engagement_id: E(5), sender_type: 'firm',   sender_name: 'Roman',                subject: 'Welcome — Pre-Purchase Review',  body: 'Sofia — welcome. Your private project space is now active. I\'ve reviewed the property listing and initial disclosures your attorney forwarded. A few items stand out that warrant environmental review before closing.\n\nI\'ll have a preliminary assessment framework ready by end of week. In the meantime, please upload any additional property documents or inspection reports you\'ve received.', read: true,  encrypted: true,  created_at: '2026-05-10T15:00:00Z' },
      { id: M(17), client_id: C(5), engagement_id: E(5), sender_type: 'client', sender_name: 'Sofia Nakamura',       subject: 'Re: Welcome',                    body: 'Roman — thank you for the quick setup. I\'m attaching the seller\'s disclosure and the general inspection report from last week. My attorney flagged the section on "prior remediation work" on page 12. That\'s what prompted this engagement.\n\nClosing is tentatively June 20 — so timing matters.', read: true,  encrypted: true,  created_at: '2026-05-11T10:00:00Z' },
    ];

    const { error: mErr } = await sb.from('messages').insert(messages);
    if (mErr) throw new Error(`messages: ${mErr.message}`);

    /* ════════════════════════════════════════════════
       TIMELINE EVENTS — detailed progression per engagement
       ════════════════════════════════════════════════ */
    const timeline = [
      // ── Whitfield (Phase 3 — full history) ──
      { id: T(1),  engagement_id: E(1), phase: '1', title: 'Engagement Accepted',             description: 'Confidential consultation completed. NDA signed. Engagement letter executed.',                                    event_type: 'milestone', event_date: '2026-03-14' },
      { id: T(2),  engagement_id: E(1), phase: '1', title: 'Initial Walk-Through',            description: 'On-site inspection. Visible water damage in west wing, potential mold behind drywall.',                           event_type: 'meeting',   event_date: '2026-03-16' },
      { id: T(3),  engagement_id: E(1), phase: '2', title: 'Phase II Commenced',              description: 'Independent assessment phase. Coordinating IEP and moisture mapping specialists.',                                 event_type: 'milestone', event_date: '2026-03-20' },
      { id: T(4),  engagement_id: E(1), phase: '2', title: 'Moisture Mapping Complete',       description: 'Full property moisture map generated. Elevated readings isolated to west wing roof junction.',                     event_type: 'document',  event_date: '2026-03-28' },
      { id: T(5),  engagement_id: E(1), phase: '2', title: 'Lab Results Received',            description: 'IEP mold panel confirms Stachybotrys in west wing samples. Report uploaded to vault.',                             event_type: 'document',  event_date: '2026-04-05' },
      { id: T(6),  engagement_id: E(1), phase: '2', title: 'Assessment Review Meeting',       description: 'Client briefing on lab results. Discussed implications and next steps. Client approved move to Phase III.',         event_type: 'meeting',   event_date: '2026-04-12' },
      { id: T(7),  engagement_id: E(1), phase: '3', title: 'Phase III Commenced',             description: 'Scope & vendor curation phase. Preparing written scope and vendor shortlist.',                                     event_type: 'milestone', event_date: '2026-04-15' },
      { id: T(8),  engagement_id: E(1), phase: '3', title: 'Vendor Proposals Received',       description: 'Three proposals: Pacific Remediation, Westside Environmental, Coastal Environmental.',                              event_type: 'document',  event_date: '2026-05-05' },
      { id: T(9),  engagement_id: E(1), phase: '3', title: 'Scope of Work — Draft',           description: 'Draft scope document prepared for client review before vendor selection.',                                          event_type: 'update',    event_date: '2026-05-10' },
      // ── Mercer (Phase 2 — ongoing assessment) ──
      { id: T(10), engagement_id: E(2), phase: '1', title: 'Engagement Accepted',             description: 'Pre-1965 estate. Full asbestos survey required before planned renovation.',                                        event_type: 'milestone', event_date: '2026-02-01' },
      { id: T(11), engagement_id: E(2), phase: '1', title: 'Initial Site Inspection',         description: 'Preliminary walk-through of both buildings. Identified high-priority sampling areas.',                              event_type: 'meeting',   event_date: '2026-02-08' },
      { id: T(12), engagement_id: E(2), phase: '2', title: 'Phase II Commenced',              description: 'Independent assessment. Building A survey and sampling initiated.',                                                  event_type: 'milestone', event_date: '2026-02-15' },
      { id: T(13), engagement_id: E(2), phase: '2', title: 'Building A Survey Complete',      description: 'Asbestos-containing materials identified in flooring, pipe insulation, and ceiling tiles.',                         event_type: 'document',  event_date: '2026-03-15' },
      { id: T(14), engagement_id: E(2), phase: '2', title: 'Family Relocation Coordinated',   description: 'Mercer family relocated to guest house for duration of assessment and planned remediation.',                         event_type: 'update',    event_date: '2026-03-20' },
      { id: T(15), engagement_id: E(2), phase: '2', title: 'Building B Sampling Initiated',   description: 'Focus areas: basement mechanical room, kitchen ceiling, second-floor library.',                                     event_type: 'milestone', event_date: '2026-05-05' },
      { id: T(16), engagement_id: E(2), phase: '2', title: 'Material Samples Submitted',      description: 'Additional samples from Building B sent to laboratory for analysis.',                                               event_type: 'document',  event_date: '2026-05-12' },
      // ── Park (Phase 1 — early stage) ──
      { id: T(17), engagement_id: E(3), phase: '1', title: 'Engagement Accepted',             description: 'Post-Palisades fire. NDA executed. Initial consultation completed.',                                                event_type: 'milestone', event_date: '2026-04-02' },
      { id: T(18), engagement_id: E(3), phase: '1', title: 'Site Photos Received',            description: 'Preliminary photographs documenting extent of fire damage to property.',                                             event_type: 'document',  event_date: '2026-04-10' },
      { id: T(19), engagement_id: E(3), phase: '1', title: 'Walk-Through Scheduled',          description: 'On-site walk-through confirmed for May 26. Full PPE required for fire-damaged areas.',                              event_type: 'update',    event_date: '2026-05-15' },
      // ── Harrington (Phase 4 — complete engagement) ──
      { id: T(20), engagement_id: E(4), phase: '1', title: 'Engagement Accepted',             description: 'Penthouse air quality complaints. Initial consultation and scope.',                                                 event_type: 'milestone', event_date: '2025-11-15' },
      { id: T(21), engagement_id: E(4), phase: '1', title: 'Initial Air Quality Testing',     description: 'Baseline VOC readings exceeded OEHHA standards in primary bedroom and living areas.',                               event_type: 'meeting',   event_date: '2025-11-22' },
      { id: T(22), engagement_id: E(4), phase: '2', title: 'Phase II — Source Investigation', description: 'Systematic testing to identify VOC sources. Focus on recent renovation materials.',                                  event_type: 'milestone', event_date: '2025-12-10' },
      { id: T(23), engagement_id: E(4), phase: '2', title: 'Source Identified',               description: 'VOCs traced to adhesives used in recent flooring installation and cabinetry sealants.',                              event_type: 'document',  event_date: '2026-01-15' },
      { id: T(24), engagement_id: E(4), phase: '3', title: 'Remediation Scope Finalized',     description: 'Targeted removal of off-gassing materials. Vendor selected: CleanAir Solutions LA.',                                 event_type: 'milestone', event_date: '2026-02-01' },
      { id: T(25), engagement_id: E(4), phase: '3', title: 'Remediation Started',             description: 'Controlled removal of identified materials. Air scrubbers installed during process.',                                event_type: 'update',    event_date: '2026-02-15' },
      { id: T(26), engagement_id: E(4), phase: '4', title: 'Remediation Complete',            description: 'All identified materials removed and replaced. Post-remediation ventilation period initiated.',                      event_type: 'milestone', event_date: '2026-03-30' },
      { id: T(27), engagement_id: E(4), phase: '4', title: 'Post-Remediation Testing',        description: '30-day post-remediation air quality testing. Three rounds of sampling.',                                             event_type: 'document',  event_date: '2026-04-30' },
      { id: T(28), engagement_id: E(4), phase: '4', title: 'Final Clearance Issued',          description: 'All VOC levels within OEHHA residential standards. Air quality certificate issued. Engagement closed.',              event_type: 'milestone', event_date: '2026-05-18' },
      // ── Nakamura (Phase 1 — just started) ──
      { id: T(29), engagement_id: E(5), phase: '1', title: 'Engagement Inquiry',              description: 'Referred by attorney. Pre-purchase environmental diligence for $8.2M acquisition.',                                 event_type: 'update',    event_date: '2026-05-08' },
      { id: T(30), engagement_id: E(5), phase: '1', title: 'NDA Executed',                    description: 'Confidentiality agreement signed. Client portal activated.',                                                         event_type: 'milestone', event_date: '2026-05-10' },
      { id: T(31), engagement_id: E(5), phase: '1', title: 'Property Disclosures Reviewed',   description: 'Seller disclosures flagged prior remediation work on page 12. Requires investigation.',                              event_type: 'document',  event_date: '2026-05-14' },
    ];

    const { error: tErr } = await sb.from('timeline_events').insert(timeline);
    if (tErr) throw new Error(`timeline_events: ${tErr.message}`);

    /* ════════════════════════════════════════════════
       NDA RECORDS
       ════════════════════════════════════════════════ */
    const ndas = [
      { id: N(1), client_id: C(1), engagement_id: E(1), signed_date: '2026-03-14', expires_date: '2028-03-14', document_id: D(1),  status: 'active' },
      { id: N(2), client_id: C(2), engagement_id: E(2), signed_date: '2026-02-01', expires_date: '2028-02-01', document_id: D(8),  status: 'active' },
      { id: N(3), client_id: C(3), engagement_id: E(3), signed_date: '2026-04-02', expires_date: '2028-04-02', document_id: D(12), status: 'active' },
      { id: N(4), client_id: C(4), engagement_id: E(4), signed_date: '2025-11-15', expires_date: '2027-11-15', document_id: D(15), status: 'active' },
      { id: N(5), client_id: C(5), engagement_id: E(5), signed_date: '2026-05-10', expires_date: '2028-05-10', document_id: D(21), status: 'active' },
    ];

    const { error: nErr } = await sb.from('nda_records').insert(ndas);
    if (nErr) throw new Error(`nda_records: ${nErr.message}`);

    /* ════════════════════════════════════════════════
       TODOS
       ════════════════════════════════════════════════ */
    const todos = [
      { id: TD(1),  client_id: C(1), engagement_id: E(1), title: 'Schedule walk-through with Alexandra', description: 'Confirm contractor availability for next week', priority: 'urgent',  status: 'pending',     due_date: '2026-05-28', visible_to_client: true },
      { id: TD(2),  client_id: C(1), engagement_id: E(1), title: 'Review vendor shortlist proposals',    description: 'Three proposals received — compare scope and pricing',                    priority: 'high',    status: 'pending',     due_date: '2026-05-30', visible_to_client: false },
      { id: TD(3),  client_id: C(2), engagement_id: E(2), title: 'Send Building B survey results',       description: null,                                                                    priority: 'high',    status: 'in_progress', due_date: '2026-06-01', visible_to_client: true },
      { id: TD(4),  client_id: C(3), engagement_id: E(3), title: 'Collect signed NDA addendum',          description: 'Park family needs to sign updated terms',                                priority: 'normal',  status: 'pending',     due_date: '2026-06-05', visible_to_client: true },
      { id: TD(5),  client_id: C(5), engagement_id: E(5), title: 'Order Phase I ESA report',             description: 'Pre-purchase environmental assessment for Nakamura acquisition',           priority: 'normal',  status: 'pending',     due_date: '2026-06-10', visible_to_client: false },
      { id: TD(6),  client_id: null,  engagement_id: null, title: 'Update fee schedule for Q3',           description: 'Review and adjust rates across all service tiers',                        priority: 'low',     status: 'pending',     due_date: '2026-06-15', visible_to_client: false },
      { id: TD(7),  client_id: C(4), engagement_id: E(4), title: 'File final clearance certificate',     description: 'Submit to county records',                                                priority: 'normal',  status: 'done',        due_date: '2026-05-20', visible_to_client: false, completed_at: '2026-05-20T10:00:00Z' },
      { id: TD(8),  client_id: C(1), engagement_id: E(1), title: 'Prepare phase transition memo',        description: 'Document readiness for Phase IV oversight',                               priority: 'urgent',  status: 'pending',     due_date: '2026-05-26', visible_to_client: true },
    ];

    const { error: tdErr } = await sb.from('todos').insert(todos);
    if (tdErr) throw new Error(`todos: ${tdErr.message}`);

    /* ── Summary ── */
    const summary = {
      success: true,
      seeded: {
        clients: clients.length,
        engagements: engagements.length,
        documents: documents.length,
        invoices: invoices.length,
        messages: messages.length,
        timeline_events: timeline.length,
        nda_records: ndas.length,
        todos: todos.length,
      },
      total_billed: invoices.reduce((s, i) => s + i.amount, 0),
      total_collected: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0),
    };

    return NextResponse.json(summary);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/* GET — convenience for browser testing */
export async function GET() {
  return NextResponse.json({
    message: 'POST /api/seed?key=jr-seed-2026 to seed the database',
    warning: 'This will DELETE all existing data and replace with test data.',
  });
}
