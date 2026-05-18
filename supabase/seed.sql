/* ── JR Advisory — Seed Data ── */
/* Run after 001_initial_schema.sql to populate test data */
/* Mirrors the localStorage seed data from testData.ts */

/* ── Admin users (create via Supabase Auth first, then update profiles) ── */
-- After creating admin accounts via Supabase dashboard:
-- UPDATE profiles SET role = 'admin' WHERE email IN ('roman@jamesroman.la', 'steven@jamesroman.la');

/* ── Clients ── */
INSERT INTO clients (id, name, email, phone, property, area, status, created_at) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Alexandra Whitfield',   'a.whitfield@proton.me', '+1 (310) 555-0142', '1247 Pacific Coast Highway, Malibu',        'Malibu',            'active',    '2026-03-14'),
  ('a0000001-0000-0000-0000-000000000002', 'Jonathan Mercer',       'jmercer@signal.org',    '+1 (310) 555-0287', '842 Stone Canyon Road, Bel Air',             'Bel Air',           'active',    '2026-02-01'),
  ('a0000001-0000-0000-0000-000000000003', 'Catherine & David Park', 'parkfamily@proton.me', '+1 (310) 555-0391', '1560 San Remo Drive, Pacific Palisades',     'Pacific Palisades', 'active',    '2026-04-02'),
  ('a0000001-0000-0000-0000-000000000004', 'Robert Harrington III', 'rh3@proton.me',         '+1 (310) 555-0455', '9100 Wilshire Blvd Penthouse, Beverly Hills', 'Beverly Hills',     'completed', '2025-11-15'),
  ('a0000001-0000-0000-0000-000000000005', 'Sofia Nakamura',        's.nakamura@signal.org', '+1 (310) 555-0512', '224 Adelaide Drive, Santa Monica',            'Santa Monica',      'pending',   '2026-05-10');

/* ── Engagements ── */
INSERT INTO engagements (id, client_id, type, phase, phase_label, start_date, next_milestone, property, notes) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Mold & Water Intrusion',      '3', 'Scope & Vendor Curation',    '2026-03-14', 'Vendor shortlist presentation — May 22',      '1247 Pacific Coast Highway, Malibu',        'Initial moisture mapping complete. Three vendors under review.'),
  ('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'Asbestos & Legacy Materials',  '2', 'Independent Assessment',     '2026-02-01', 'Survey results — May 19',                      '842 Stone Canyon Road, Bel Air',             'Pre-1965 estate. Full survey underway. Family relocated during assessment.'),
  ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'Fire & Smoke Residue',         '1', 'Confidential Consultation',  '2026-04-02', 'Walk-through scheduled — May 20',              '1560 San Remo Drive, Pacific Palisades',     'Post-Palisades fire. Initial consultation complete. NDA signed.'),
  ('b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', 'Indoor Air Quality & VOCs',    '4', 'Oversight & Clearance',      '2025-11-15', 'Final clearance testing — May 25',              '9100 Wilshire Blvd Penthouse, Beverly Hills', 'Remediation complete. Awaiting final clearance verification.'),
  ('b0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', 'Pre-Purchase Diligence',       '1', 'Confidential Consultation',  '2026-05-10', 'Initial property review — May 23',              '224 Adelaide Drive, Santa Monica',            'Prospective buyer. Environmental review before acquisition.');

/* ── Documents ── */
INSERT INTO documents (client_id, engagement_id, name, category, status, file_size, created_at) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Mutual NDA — Whitfield',                      'nda',          'final',          '245 KB',  '2026-03-14'),
  ('a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Moisture Mapping Report',                      'lab-results',  'final',          '1.8 MB',  '2026-03-28'),
  ('a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'IEP Lab Results — Mold Panel',                 'lab-results',  'final',          '3.2 MB',  '2026-04-05'),
  ('a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Vendor Proposal — Pacific Remediation',        'proposals',    'pending-review', '890 KB',  '2026-05-01'),
  ('a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Vendor Proposal — Westside Environmental',     'proposals',    'pending-review', '1.1 MB',  '2026-05-03'),
  ('a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Scope of Work — Draft',                        'proposals',    'draft',          '420 KB',  '2026-05-10'),
  ('a0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', 'Mutual NDA — Mercer',                          'nda',          'final',          '245 KB',  '2026-02-01'),
  ('a0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', 'Asbestos Survey — Building A',                 'lab-results',  'final',          '4.5 MB',  '2026-03-15'),
  ('a0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', 'Material Sample Analysis',                     'lab-results',  'pending-review', '2.1 MB',  '2026-05-12'),
  ('a0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000003', 'Mutual NDA — Park Family',                     'nda',          'final',          '248 KB',  '2026-04-02'),
  ('a0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000003', 'Preliminary Site Photos',                      'reports',      'final',          '12.4 MB', '2026-04-10'),
  ('a0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000004', 'Final Clearance Report',                       'clearance',    'draft',          '2.8 MB',  '2026-05-15'),
  ('a0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000004', 'Invoice — Q1 2026',                            'invoices',     'final',          '180 KB',  '2026-04-01'),
  ('a0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000004', 'Invoice — Q2 2026',                            'invoices',     'pending-review', '195 KB',  '2026-05-01');

/* ── Messages ── */
INSERT INTO messages (client_id, engagement_id, sender_type, sender_name, subject, body, read, encrypted, created_at) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'firm',   'Roman',              'Welcome to Your Office',     E'Alexandra — your private project space is ready. All engagement documents, status updates, and communications will be accessible here.\n\nPlease review the moisture mapping report at your earliest convenience.', true,  true, '2026-03-14 10:00:00+00'),
  ('a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'client', 'Alexandra Whitfield', 'Re: Welcome to Your Office', 'Roman, thank you. I''ve reviewed the moisture mapping report. The readings in the west wing are concerning — can we discuss the implications before moving to vendor selection?', true,  true, '2026-03-15 14:30:00+00'),
  ('a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'firm',   'Steven',             'West Wing Assessment',       E'Alexandra — I walked the west wing yesterday. The elevated readings are consistent with the roof junction we flagged during initial inspection.\n\nI''ll have the updated scope by end of week.', true,  true, '2026-03-18 09:15:00+00'),
  ('a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'firm',   'Roman',              'Vendor Proposals Ready',     'Two proposals are now in your document vault: Pacific Remediation and Westside Environmental. My annotated comparison will follow tomorrow.', false, true, '2026-05-03 11:00:00+00'),
  ('a0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', 'firm',   'Roman',              'Survey Progress Update',     'Jonathan — Building A survey is complete. Results are in your vault. Building B begins next week.', true,  true, '2026-03-16 16:00:00+00'),
  ('a0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', 'client', 'Jonathan Mercer',    'Re: Survey Progress',        'Understood. What should we expect from the Building B survey? Any areas of particular concern based on A?', true,  true, '2026-03-17 08:45:00+00'),
  ('a0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000003', 'firm',   'Steven',             'Walk-Through Confirmation',  E'Catherine, David — confirming the walk-through for May 20 at 9 AM.\n\nAs discussed, all findings will be under the standing NDA.', false, true, '2026-05-15 10:00:00+00');

/* ── Timeline Events ── */
INSERT INTO timeline_events (engagement_id, phase, title, description, event_type, event_date) VALUES
  ('b0000001-0000-0000-0000-000000000001', '1', 'Engagement Accepted',     'Confidential consultation completed. NDA signed. Engagement letter executed.',     'milestone', '2026-03-14'),
  ('b0000001-0000-0000-0000-000000000001', '1', 'Initial Walk-Through',    'On-site inspection. Noted visible water damage in west wing.',                     'meeting',   '2026-03-16'),
  ('b0000001-0000-0000-0000-000000000001', '2', 'Phase II Commenced',      'Independent assessment phase. Coordinating IEP and moisture mapping specialists.', 'milestone', '2026-03-20'),
  ('b0000001-0000-0000-0000-000000000001', '2', 'Moisture Mapping Complete', 'Full property moisture map generated. Elevated readings isolated to west wing.',  'document',  '2026-03-28'),
  ('b0000001-0000-0000-0000-000000000001', '2', 'Lab Results Received',    'IEP mold panel confirms Stachybotrys in west wing samples.',                      'document',  '2026-04-05'),
  ('b0000001-0000-0000-0000-000000000001', '3', 'Phase III Commenced',     'Scope & vendor curation phase. Preparing scope and vendor shortlist.',             'milestone', '2026-04-15'),
  ('b0000001-0000-0000-0000-000000000001', '3', 'Vendor Proposals Received', 'Two proposals: Pacific Remediation and Westside Environmental.',                 'document',  '2026-05-03'),
  ('b0000001-0000-0000-0000-000000000001', '3', 'Scope of Work — Draft',   'Draft scope prepared for client review.',                                          'update',    '2026-05-10'),
  ('b0000001-0000-0000-0000-000000000002', '1', 'Engagement Accepted',     'Pre-1965 estate. Full asbestos survey required before renovation.',                'milestone', '2026-02-01'),
  ('b0000001-0000-0000-0000-000000000002', '2', 'Building A Survey Complete', 'Asbestos-containing materials identified in flooring, pipe insulation, ceiling tiles.', 'document', '2026-03-15'),
  ('b0000001-0000-0000-0000-000000000002', '2', 'Material Samples Submitted', 'Additional samples from Building B sent to laboratory.',                        'document',  '2026-05-12');

/* ── Invoices ── */
INSERT INTO invoices (client_id, engagement_id, invoice_number, description, amount, status, due_date, paid_date) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'JRA-2026-001', 'Phase I — Confidential Consultation',                    4500,  'paid', '2026-04-01', '2026-03-28'),
  ('a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'JRA-2026-002', 'Phase II — Independent Assessment',                      8750,  'paid', '2026-04-15', '2026-04-12'),
  ('a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'JRA-2026-003', 'Phase III — Scope & Vendor Curation',                    6200,  'sent', '2026-05-30', NULL),
  ('a0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', 'JRA-2026-004', 'Phase I — Confidential Consultation',                    4500,  'paid', '2026-03-01', '2026-02-25'),
  ('a0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', 'JRA-2026-005', 'Phase II — Independent Assessment (Asbestos Survey)',    12400,  'sent', '2026-05-25', NULL),
  ('a0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000004', 'JRA-2026-006', 'Phases I–IV — Full Engagement (Indoor Air Quality)',     28500,  'paid', '2026-04-01', '2026-04-01');

/* ── NDA Records ── */
INSERT INTO nda_records (client_id, engagement_id, signed_date, expires_date, status) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', '2026-03-14', '2027-03-14', 'active'),
  ('a0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', '2026-02-01', '2027-02-01', 'active'),
  ('a0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000003', '2026-04-02', '2027-04-02', 'active'),
  ('a0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000004', '2025-11-15', '2026-11-15', 'active'),
  ('a0000001-0000-0000-0000-000000000005', NULL,                                    '2026-05-10', '2027-05-10', 'active');
