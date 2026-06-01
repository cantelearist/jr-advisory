# JR Advisory — Technical Handoff

> **James Roman Advisory** · Private client portal for hazmat remediation oversight
> Last updated: June 1, 2026 · Commit `4d2e1b1`

---

## 1. Project Overview

| Key | Value |
|---|---|
| **Repo** | `github.com/cantelearist/jr-advisory` |
| **Stack** | Next.js 15, React 19, TypeScript 5.9, Supabase (Postgres + Auth + Storage) |
| **Runtime** | Bun (build), Node.js (Vercel Functions) |
| **Hosting** | Vercel — auto-deploys on push to `main` |
| **Production URL** | `https://www.jamesroman.la` (naked domain 308→www) |
| **Test URL** | `https://jr-advisory-test.vercel.app` |
| **Vercel Projects** | `jr-advisory` (production), `jr-advisory-test` (test) |
| **Branch** | `main` (production), `prototype` (experiments) |

### What It Is

Two apps in one repo:
1. **Marketing Site** — Public-facing luxury advisory website (14 marketing components)
2. **Client Portal** — Authenticated private workspace: Dashboard, Documents, Timeline, Messages, Invoices, Welcome onboarding wizard, plus a full Admin panel

---

## 2. File Structure (123 files)

```
jr-advisory/
├── public/
│   ├── favicon.svg
│   ├── founders/roman.png, stephen.png
│   └── images/heroes/{beverly-hills,brentwood,malibu,pacific-palisades}.jpg
│         └── logo.png
│
├── src/
│   ├── app/
│   │   ├── page.tsx                          # Homepage (marketing)
│   │   ├── layout.tsx                        # Root layout (fonts, metadata)
│   │   ├── globals.css                       # Global styles
│   │   │
│   │   ├── # ── Marketing Pages ──
│   │   ├── counsel/[slug]/page.tsx           # Dynamic counsel profiles
│   │   ├── engagements/[id]/page.tsx         # Engagement detail
│   │   ├── nda/page.tsx                      # NDA page
│   │   ├── cookies/page.tsx                  # Cookie policy
│   │   ├── privacy/page.tsx                  # Privacy policy
│   │   ├── terms/page.tsx                    # Terms of service
│   │   ├── disclaimer/page.tsx               # Disclaimer
│   │   ├── accessibility/page.tsx            # Accessibility statement
│   │   │
│   │   ├── # ── Portal Pages ──
│   │   ├── portal/
│   │   │   ├── page.tsx                      # Login page
│   │   │   ├── layout.tsx                    # Portal layout (AuthProvider)
│   │   │   ├── welcome/page.tsx              # Onboarding wizard (5-step tour)
│   │   │   ├── dashboard/page.tsx            # Client dashboard
│   │   │   ├── documents/page.tsx            # Document vault
│   │   │   ├── timeline/page.tsx             # Engagement timeline
│   │   │   ├── messages/page.tsx             # Secure messaging
│   │   │   ├── invoices/page.tsx             # Billing & payments
│   │   │   ├── payments/success/page.tsx     # Stripe success redirect
│   │   │   └── admin/
│   │   │       ├── page.tsx                  # Admin panel (9 tabs)
│   │   │       └── clients/[id]/page.tsx     # Client detail view
│   │   │
│   │   ├── # ── API Routes ──
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── route.ts                  # Admin CRUD (all tables)
│   │   │   │   └── clients/[id]/route.ts     # Client detail + update
│   │   │   ├── auth/
│   │   │   │   ├── invite/route.ts           # Send client invitation
│   │   │   │   └── setup/route.ts            # DB auth trigger setup
│   │   │   ├── documents/
│   │   │   │   ├── upload/route.ts           # Upload to Supabase Storage
│   │   │   │   ├── download/route.ts         # Signed download URL
│   │   │   │   └── delete/route.ts           # Remove document
│   │   │   ├── messages/
│   │   │   │   ├── send/route.ts             # Send message
│   │   │   │   ├── list/route.ts             # List conversations
│   │   │   │   └── read/route.ts             # Mark as read
│   │   │   ├── payments/
│   │   │   │   ├── checkout/route.ts         # Stripe checkout session
│   │   │   │   └── webhook/route.ts          # Stripe webhook handler
│   │   │   ├── portal/
│   │   │   │   ├── data/route.ts             # Portal data (server-auth)
│   │   │   │   └── invoices/route.ts         # Invoice list API
│   │   │   ├── export/
│   │   │   │   ├── invoice/route.ts          # PDF invoice export
│   │   │   │   └── report/route.ts           # PDF engagement report
│   │   │   ├── signatures/
│   │   │   │   ├── request/route.ts          # Create signature request
│   │   │   │   ├── sign/route.ts             # Submit signature
│   │   │   │   └── list/route.ts             # List signature requests
│   │   │   ├── todos/
│   │   │   │   ├── route.ts                  # CRUD todos
│   │   │   │   └── [id]/route.ts             # Update/delete single todo
│   │   │   ├── notifications/send/route.ts   # Email notifications (Resend)
│   │   │   ├── migrate/
│   │   │   │   ├── route.ts                  # General migration
│   │   │   │   └── signatures/route.ts       # Signature table migration
│   │   │   ├── seed/route.ts                 # Seed all tables with test data
│   │   │   ├── storage/setup/route.ts        # Create Storage buckets
│   │   │   └── fix-trigger/route.ts          # Fix auth trigger
│   │   │
│   │   └── auth/callback/route.ts            # Supabase auth callback
│   │
│   ├── components/
│   │   ├── marketing/                        # 14 marketing components
│   │   │   ├── Hero.tsx, Nav.tsx, Founders.tsx, Practice.tsx
│   │   │   ├── Engagement.tsx, Matters.tsx, Counsel.tsx
│   │   │   ├── Discretion.tsx, ClientOffice.tsx, Contact.tsx
│   │   │   ├── CookieBanner.tsx, SiteFooter.tsx
│   │   │   ├── LegalLayout.tsx, Logo.tsx, Plate.tsx
│   │   │   └── index.ts                      # Barrel export
│   │   └── portal/
│   │       ├── AuthProvider.tsx               # Auth context + useAuth hook
│   │       ├── PortalNav.tsx                  # Portal navigation bar
│   │       ├── Scene3D.tsx                    # CSS/Canvas particle animation
│   │       ├── Modal.tsx                      # Reusable modal
│   │       ├── RichTextEditor.tsx             # Rich text editor component
│   │       └── admin/
│   │           ├── ClientModal.tsx            # Create/edit client modal
│   │           ├── EngagementModal.tsx        # Create/edit engagement
│   │           ├── InvoiceModal.tsx           # Create/edit invoice
│   │           ├── DocumentUpload.tsx         # Admin document upload
│   │           ├── ComposeMessage.tsx         # Admin message composer
│   │           └── ContentEditor.tsx          # CMS content editor
│   │
│   ├── hooks/
│   │   ├── useReveal.ts                      # Scroll reveal animation
│   │   └── useSmoothScroll.ts                # Smooth scroll behavior
│   │
│   ├── lib/
│   │   ├── supabase.ts                       # Supabase client (generic)
│   │   ├── supabase-browser.ts               # Browser Supabase client (SSR)
│   │   ├── supabase-server.ts                # Server Supabase client (SSR)
│   │   ├── auth.tsx                          # Auth utilities
│   │   ├── portal-data.ts                    # fetchPortalData() — client-side
│   │   ├── database.types.ts                 # TypeScript types for all tables
│   │   ├── notifications.ts                  # Email notification helpers
│   │   ├── constants.ts                      # Site constants (phone, email, etc)
│   │   ├── content.ts                        # CMS content utilities
│   │   ├── data.ts                           # Data utilities
│   │   └── testData.ts                       # Seed data definitions
│   │
│   ├── middleware.ts                         # Auth gate for /portal/*
│   │
│   └── __tests__/                            # Vitest unit tests
│       ├── setup.ts
│       ├── components/*.test.tsx             # Component tests
│       └── lib/constants.test.ts
│
├── package.json                              # Dependencies + scripts
├── vercel.json                               # Build: bun run build
├── next.config.ts                            # reactStrictMode: true
├── tsconfig.json                             # strict, skipLibCheck
├── eslint.config.mjs                         # next/core-web-vitals
├── vitest.config.ts                          # Vitest configuration
├── .env.example                              # Environment variable template
└── .gitignore
```

---

## 3. Database Schema (Supabase / Postgres)

### Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `profiles` | User profiles (linked to auth.users) | id, role, full_name, email |
| `clients` | Client records | id, profile_id, name, email, property, area, status |
| `engagements` | Project engagements per client | id, client_id, type, phase (1-4), phase_label, property |
| `documents` | Uploaded files metadata | id, client_id, engagement_id, name, category, status, file_path |
| `messages` | Secure messages | id, client_id, engagement_id, sender_type, subject, body |
| `timeline_events` | Phase milestones & events | id, engagement_id, phase, title, event_type, event_date |
| `invoices` | Billing records | id, client_id, invoice_number, amount, status, stripe_session_id |
| `audit_log` | System activity log | id, user_id, action, entity_type, entity_id, metadata |
| `todo` | Tasks & to-dos | id, client_id, assigned_to, title, priority, status, due_date |
| `signature_requests` | E-signature tracking | id, document_id, client_id, status, signed_at, signature_data |
| `notifications` | In-app notification feed | id, target, type, title, body, link, read, metadata |
| `site_content` | CMS content blocks | id, section, key, label, content, content_type |

### Enum Types

```
ClientStatus:      active | pending | completed | archived
EngagementPhase:   1 | 2 | 3 | 4
DocCategory:       nda | lab-results | proposals | clearance | invoices | reports
DocStatus:         final | draft | pending-review
MsgSender:         firm | client
TimelineType:      milestone | document | meeting | update
InvoiceStatus:     draft | sent | paid | overdue | cancelled
UserRole:          admin | client
TodoPriority:      urgent | high | normal | low
TodoStatus:        pending | in_progress | done
SignatureStatus:   pending | signed | declined | expired
NotificationType:  message | document | invoice | signature | phase | system
ContentType:       text | html | markdown
```

### Storage Buckets

| Bucket | Purpose |
|---|---|
| `documents` | Client document uploads (PDFs, images, etc) |

### Auth Trigger

A `handle_new_user()` trigger on `auth.users` auto-creates a row in `profiles` on signup. This trigger must be manually set up via SQL Editor in Supabase Dashboard (see Setup section).

---

## 4. API Routes Reference

All routes are Next.js API routes under `/api/`. Admin routes use the Supabase service role key (bypasses RLS). Portal routes authenticate via the user's session cookie.

### Admin (Service Role — RLS bypass)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/admin?table={name}` | Key | List rows from any table |
| POST | `/api/admin` | Key | Insert row into any table |
| PUT | `/api/admin` | Key | Update row by ID |
| DELETE | `/api/admin` | Key | Delete row by ID |
| GET | `/api/admin/clients/[id]` | Key | Full client detail + relations |
| PUT | `/api/admin/clients/[id]` | Key | Update client + notes |

### Portal Data (Session Auth)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/portal/data` | Session | All client data (engagement, docs, messages, invoices, todos) |
| GET | `/api/portal/invoices` | Session | Client's invoices |

### Auth

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/invite` | Admin | Create account + send invite email |
| POST | `/api/auth/setup?key=jr-auth-2026` | Key | Set up auth trigger + profiles table |

### Documents

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/documents/upload` | Session | Upload file to Supabase Storage |
| GET | `/api/documents/download?id={id}` | Session | Get signed download URL |
| DELETE | `/api/documents/delete` | Session | Remove document + storage file |

### Messages

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/messages/send` | Session | Send a message |
| GET | `/api/messages/list?client_id={id}` | Session | List message threads |
| POST | `/api/messages/read` | Session | Mark message as read |

### Payments (Stripe)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/payments/checkout` | Session | Create Stripe checkout session |
| POST | `/api/payments/webhook` | Stripe | Handle payment webhooks |

### Signatures

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/signatures/request` | Admin | Create signature request |
| POST | `/api/signatures/sign` | Session | Submit signature |
| GET | `/api/signatures/list?client_id={id}` | Session | List signature requests |

### Todos

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET/POST | `/api/todos` | Session | List / create todos |
| PUT/DELETE | `/api/todos/[id]` | Session | Update / delete a todo |

### Export

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/export/invoice?id={id}` | Session | PDF invoice download |
| GET | `/api/export/report?id={id}` | Session | PDF engagement report |

### Notifications

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/notifications/send` | Admin | Send branded email via Resend |

### Setup / Migration (One-time, key-protected)

| Method | Route | Key | Purpose |
|---|---|---|---|
| POST | `/api/seed?key=jr-seed-2026` | Key | Wipe + re-seed all tables |
| POST | `/api/storage/setup?key=jr-storage-2026` | Key | Create documents bucket |
| POST | `/api/migrate/signatures?key=jr-migrate-2026` | Key | Create signature_requests table |
| POST | `/api/fix-trigger?key=jr-fix-2026` | Key | Fix auth trigger (needs DATABASE_URL) |

---

## 5. Authentication Flow

### Stack
- **Supabase Auth** — email/password + magic link
- **@supabase/ssr** — server-side session handling via cookies
- **Next.js Middleware** — protects all `/portal/*` routes

### How It Works

1. User visits `/portal` → login page
2. `middleware.ts` checks session on every `/portal/*` request:
   - No session → redirect to `/portal` with `?redirect=` param
   - Has session on `/portal` → redirect to `/portal/admin` (admin) or `/portal/dashboard` (client)
3. On login, checks `user_metadata.onboarded`:
   - `onboarded === false` → redirect to `/portal/welcome` (first login)
   - Otherwise → redirect to `/portal/dashboard`
4. `AuthProvider.tsx` wraps the portal layout, provides `useAuth()` hook
5. Portal pages call `/api/portal/data` server-side (service role) to fetch data — does NOT rely on client-side `user` state

### Key Pattern: Auth Race Condition

The `useAuth()` hook's `user` object may be `null` on direct page navigation (before the session resolves). **All portal pages must call `fetchPortalData()` on mount WITHOUT gating on `user` or `authLoading`.** The API handles auth server-side.

```tsx
// ✅ CORRECT — call immediately
useEffect(() => {
  fetchPortalData().then(setData);
}, []);

// ❌ WRONG — data never loads on direct navigation
useEffect(() => {
  if (authLoading || !user) return;
  fetchPortalData().then(setData);
}, [user, authLoading]);
```

### Roles
- `admin` — Full access to admin panel + all client data
- `client` — Access to own engagement data only

### Test Credentials
- **Admin:** `roman@jamesroman.la` / `JR-admin-2026!`
- **Client:** `a.whitfield@proton.me` / `jr-client-2026`

---

## 6. Environment Variables

### Required (set on Vercel)

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | Public anon key (used by browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | Server-side admin key (bypasses RLS) |

### Optional (feature-dependent)

| Variable | Where | Purpose |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API keys | Payment processing |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks | Webhook verification |
| `RESEND_API_KEY` | Resend Dashboard | Email notifications |
| `NOTIFICATION_FROM_EMAIL` | Your domain | Sender email for notifications |
| `DATABASE_URL` | Supabase Dashboard → Settings → Database | Direct Postgres (for trigger fix route only) |

### Currently Connected
- ✅ Supabase (all 3 keys — both Vercel projects, all envs)
- ✅ Database password: set (used during migration, June 1 2026)
- ⏳ Stripe — keys obtained, need to add to Vercel env vars: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- ⏳ Resend — key obtained (`re_FY8Qzkak_...`), need to add `RESEND_API_KEY` + `NOTIFICATION_FROM_EMAIL` to Vercel
- ⏳ DATABASE_URL — not set on Vercel (only needed for `/api/fix-trigger` route)

### Stripe Webhook
- Webhook ID: `we_1TbAcV9fhKrRctJYo3Fpjr8G`
- URL: `https://www.jamesroman.la/api/payments/webhook`
- Events: `checkout.session.completed`, `payment_intent.succeeded`
- Status: Enabled — will fire once Stripe env vars are set on Vercel

---

## 7. Deployment

### Auto-Deploy
Push to `main` → Vercel builds automatically with `bun run build` (per `vercel.json`).

### Build Notes
- `vercel.json` uses `bun run build` — this skips the test suite. CI pipeline (`bun run ci`) runs lint + typecheck + test + build.
- ESLint: `next/core-web-vitals`, `@next/next/no-img-element` off
- TypeScript: `strict: true`, `skipLibCheck: true`
- First Load JS: ~102 kB shared

### DNS
- Domain: `jamesroman.la` (Namecheap)
- `jamesroman.la` → 308 redirect → `www.jamesroman.la`
- `www.jamesroman.la` → Vercel `jr-advisory` project

### Vercel Configuration
- **Team:** `team_ftaa0jTNxLRxCmbAJci8SgMY`
- **User:** `roman-2757`
- Supabase integration connected to both projects

---

## 8. Key Patterns & Gotchas

### RLS (Row Level Security)
- Browser client uses the anon key → RLS blocks direct reads
- All admin data goes through `/api/admin` route (uses service role key to bypass RLS)
- Portal data goes through `/api/portal/data` (server-side auth, service role)
- **Never read tables directly from the browser** — always go through API routes

### Supabase SSR Cookie Pattern
Every file that creates a server client needs explicit TypeScript typing on `setAll`:
```typescript
setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) { ... }
```

### Next.js 15 Specifics
- `useSearchParams()` requires wrapping in `<Suspense>` boundary
- `'use client'` + `export const dynamic` cannot coexist
- PortalNav uses `usePathname()` internally — does not accept props

### Stripe
- `new Stripe(key)` at module level crashes the build when key is empty — must use lazy initialization inside request handlers
- Stripe columns on `invoices` table: `stripe_session_id`, `stripe_payment_id`

### Seed Data
- Endpoint: `POST /api/seed?key=jr-seed-2026`
- UUID format: `c0000000-c000-4000-a000-00000000XXXX`
- Uses `.not('id', 'is', null)` for deletes (`.neq('id', '')` fails with UUID columns)
- Singular table names (`todo` not `todos`)
- Avoid inserting `null` explicitly on nullable columns — omit them

### PostgREST Schema Cache
- New tables may be visible for SELECT before INSERT
- Reliable fix: restart Supabase project from Dashboard → Settings → General

### Admin Panel Tabs
`OVERVIEW · CLIENTS · ENGAGEMENTS · DOCUMENTS · MESSAGES · INVOICES · ACTIVITY · CONTENT · SETTINGS`

Uses IIFE pattern for complex tab content:
```tsx
{tab === 'x' && (() => { ... return (<div>...</div>); })()}
```

---

## 9. Design System

### Typography
- **Display/Headings:** Cormorant Garamond (serif), light weight
- **Body/UI:** Inter (sans-serif)
- **Labels/Meta:** Inter, tracked uppercase, 9-10px

### Colors
- Background: `#000` (pure black)
- Text: `#fff` primary, `rgba(255,255,255,0.4)` secondary
- Gold accent: `#c9a96e` (highlights, borders, active states)
- Status: Green (paid/active), Red/amber (overdue), Gold (in-review)

### Components
- All portal pages use inline `<style jsx>` — no external CSS modules
- Scene3D: pure CSS/Canvas particle animation (zero external deps, replaced Three.js)
- Mobile breakpoints: 1024px, 768px, 480px
- PortalNav: icon-only mode at 768px

---

## 10. Setup From Scratch

### Prerequisites
- Node.js 18+ or Bun
- Supabase project (free tier works)
- Vercel account
- GitHub repo access

### Steps

1. **Clone & install**
   ```bash
   git clone https://github.com/cantelearist/jr-advisory.git
   cd jr-advisory
   bun install
   ```

2. **Set environment variables**
   ```bash
   cp .env.example .env.local
   # Fill in Supabase URL, anon key, service role key
   ```

3. **Set up Supabase**
   - Create tables matching `database.types.ts` schema
   - Run auth setup: `POST /api/auth/setup?key=jr-auth-2026`
   - Create storage bucket: `POST /api/storage/setup?key=jr-storage-2026`
   - Create signature table: `POST /api/migrate/signatures?key=jr-migrate-2026`
   - Set up auth trigger in SQL Editor:
     ```sql
     CREATE OR REPLACE FUNCTION handle_new_user()
     RETURNS TRIGGER AS $$
     BEGIN
       INSERT INTO profiles (id, role, full_name, email)
       VALUES (
         NEW.id,
         COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
         COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
         NEW.email
       );
       RETURN NEW;
     END;
     $$ LANGUAGE plpgsql SECURITY DEFINER;

     CREATE TRIGGER on_auth_user_created
       AFTER INSERT ON auth.users
       FOR EACH ROW EXECUTE FUNCTION handle_new_user();
     ```

4. **Seed test data**
   ```bash
   curl -X POST "http://localhost:3000/api/seed?key=jr-seed-2026"
   ```

5. **Run locally**
   ```bash
   bun dev
   ```

6. **Deploy to Vercel**
   - Connect GitHub repo
   - Set all environment variables
   - Build command is automatic via `vercel.json`

### Optional: Stripe Integration
1. Create Stripe account
2. Add `STRIPE_SECRET_KEY` to Vercel env vars
3. Add webhook endpoint: `https://www.jamesroman.la/api/payments/webhook`
4. Add `STRIPE_WEBHOOK_SECRET` to Vercel env vars
5. Add Stripe columns to invoices table:
   ```sql
   ALTER TABLE invoices ADD COLUMN stripe_session_id text;
   ALTER TABLE invoices ADD COLUMN stripe_payment_id text;
   ```

### Optional: Email Notifications (Resend)
1. Create Resend account, verify domain
2. Add `RESEND_API_KEY` + `NOTIFICATION_FROM_EMAIL` to Vercel env vars

---

## 11. Known Issues & Pending Items

| Issue | Status | Fix |
|---|---|---|
| Database tables | ✅ All 10 live | Migrated June 1, 2026 — all tables, enums, indexes, RLS policies created |
| Auth trigger (`handle_new_user`) | ⚠️ Needs setup | Paste SQL (see §10) in Supabase Dashboard → SQL Editor → Run |
| Stripe env vars | ⏳ Keys ready, not deployed | Add 3 vars to Vercel env vars, then redeploy |
| Resend env vars | ⏳ Key ready, not deployed | Add `RESEND_API_KEY` + `NOTIFICATION_FROM_EMAIL` to Vercel |
| Resend domain verification | ⏳ Not done | Add DNS records in Namecheap; until then use `onboarding@resend.dev` |
| favicon.ico | ⚠️ Returns 404 | Only `favicon.svg` exists in `/public`; add a `.ico` or update `layout.tsx` metadata |
| `/login` route | ⚠️ Returns 404 | No `/login` page exists — login is at `/portal` |
| PostgREST schema cache | Intermittent | Restart project in Dashboard if new tables aren't writable |
| Vercel API token | ❌ Expired | Generate new one in Vercel → Settings → Tokens (if needed for API access) |

### 3 Steps to Go Live (manual)
1. **Supabase SQL Editor** — paste & run the `handle_new_user()` trigger SQL above
2. **Vercel Environment Variables** — add 5 keys: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `NOTIFICATION_FROM_EMAIL`
3. **Redeploy** on Vercel (Deployments → Redeploy last Production deployment)

---

## 12. Sprint History

| Sprint | What | Commit |
|---|---|---|
| 1-2 | Marketing site (14 components, legal pages, animations) | Multiple |
| 3 | Admin CRUD + CMS | `bb8f1b54` |
| 4A | Authentication layer (Supabase Auth + middleware) | `8ee057d6` |
| 4B | Document Vault (upload/download/delete + admin tab) | `ff2c6d05` |
| 4C | Live Messaging (send/list/read + admin compose) | `17aa6e8e` |
| 4D | Stripe Payments (checkout/webhook + success page) | `913a6aad` |
| 5A | Client Detail Page (5-tab view, editable notes) | `2e4cad29` |
| 5B | Engagement Kanban Board (4-column drag-and-drop) | `3f176be7` |
| 5C | Email Notifications (Resend, 5 branded templates) | `45905a66` |
| 5D | Audit Log Viewer (ACTIVITY tab + event feed) | `fd3f8b35` |
| 6A | To-Do List & Urgent Tasks | — |
| 6BCD | Portal Data API + Invoice API + E-Signature + PDF Export | `1c7825d8` |
| 7A | Client Onboarding (5-step welcome wizard) | `5207feb3` |
| 7B | Mobile Polish (all pages responsive 768/480px) | `5207feb3` |
| Fixes | Auth race condition on all portal pages | `fee39e5a`, `d8dc0e7f` |
| Handoff | HANDOFF.md added to repo | `dcda4e62` |
| Polish | Mobile responsive fixes + audit log seed data | `3b642d33` |
| 5A-API | API Security Hardening (rate limiting, input validation) | `e463aad` |
| 5B-DB | Database Setup — missing tables migration file | `6c8e060` |
| 5C-Wire | Integration Wiring (Supabase ↔ API routes) | `e2afc05` |
| 5D-Hard | Polish & Hardening (error handling, edge cases) | `fecab85` |
| DB-Fix | RLS policy fix — uuid extension, WITH CHECK on all policies | `21e1cf9` |
| DB-Migrate | All 10 tables live — `002_missing_tables.sql` applied via SQL Editor | `4d2e1b1` |

---

## 13. Dependencies

### Production
| Package | Version | Purpose |
|---|---|---|
| `next` | ^15 | React framework |
| `react` / `react-dom` | ^19 | UI library |
| `@supabase/supabase-js` | ^2.49.1 | Supabase client |
| `@supabase/ssr` | ^0.6.1 | Server-side auth (cookies) |
| `stripe` | ^17.7.0 | Payment processing |
| `resend` | ^4.0.0 | Email notifications |
| `postgres` | ^3.4.5 | Direct Postgres (trigger fix route) |

### Dev
| Package | Version | Purpose |
|---|---|---|
| `typescript` | ^5.9.3 | Type checking |
| `vitest` | ^4.1.6 | Unit testing |
| `@testing-library/react` | ^16.3.2 | Component testing |
| `jsdom` | ^29.1.1 | DOM environment for tests |
| `eslint` / `eslint-config-next` | ^9 / ^15 | Linting |

---

## 14. Latest Test Results (June 1, 2026)

### Public Pages
| Route | Status | Notes |
|---|---|---|
| `/` (homepage) | ✅ 200 | 95ms total load |
| `/portal` (login) | ✅ 200 | 191ms |
| `/portal/dashboard` | ✅ 307→login | Auth redirect working |
| `/privacy` | ✅ 200 | |
| `/accessibility` | ✅ 200 | |
| `/cookies` | ✅ 200 | |
| `/nda` | ✅ 200 | |
| `/sitemap.xml` | ✅ 200 | |
| `/terms` | ✅ 307 | Redirect (expected) |
| `/disclaimer` | ✅ 307 | Redirect (expected) |

### Portal Pages (all 307→login when unauthenticated — correct)
`/portal/documents`, `/portal/invoices`, `/portal/messages`, `/portal/timeline`, `/portal/welcome`, `/portal/admin`

### API Routes
| Route | Status | Notes |
|---|---|---|
| `/api/health` | ✅ 401 | Key-protected (working) |
| `/api/todos` | ✅ 401 | Session-protected |
| `/api/admin` | ✅ 401 | Key-protected |
| `/auth/callback` | ✅ 307 | Redirect (expected) |

### Database (all 10 tables verified via Supabase REST API)
```
✅ profiles           ✅ clients
✅ engagements         ✅ documents
✅ invoices            ✅ timeline_events
✅ todo                ✅ signature_requests
✅ notifications       ✅ site_content
```

### Security Headers
| Header | Value |
|---|---|
| `Content-Security-Policy` | ✅ Full policy (self + Stripe + Supabase + Vercel) |
| `Strict-Transport-Security` | ✅ `max-age=31536000; includeSubDomains; preload` |
| `X-Content-Type-Options` | ✅ `nosniff` |
| `X-Frame-Options` | ✅ `DENY` |

### Performance
| Page | TTFB | Total |
|---|---|---|
| Homepage | 89ms | 95ms |
| Login | 44ms | 45ms |

### Supabase Auth
✅ Reachable — providers available (Apple, Azure, Bitbucket, Discord, + more)

### Minor Issues Found
- `favicon.ico` → 404 (only `favicon.svg` exists)
- `/login` → 404 (login page is at `/portal`)

---

## 15. Suggested Next Steps

### High Priority (pre-launch)
1. **Complete 3-step setup** — auth trigger, env vars, redeploy (see §11)
2. **Re-seed data** — run `POST /api/seed?key=jr-seed-2026` after trigger is live to populate all tables + audit log
3. **Verify Stripe checkout flow** — test with Stripe test card (`4242 4242 4242 4242`)
4. **Verify Resend emails** — test via admin compose → sends notification to client
5. **Domain email verification** — add Resend DNS records in Namecheap for `jamesroman.la` sender identity

### Medium Priority (post-launch polish)
6. **Real client accounts** — use admin invite flow to create production accounts
7. **Custom 404 page** — branded error page matching the design system
8. **Rate limiting** — add rate limits to public API routes (seed, auth setup)
9. **File type validation** — restrict uploads to PDF, DOC, JPG, PNG
10. **Session timeout** — auto-logout after 30 min idle

### Feature Ideas
11. **Client notifications** — push/email when documents are uploaded or invoices created
12. **Dashboard analytics** — monthly trend charts (revenue, active engagements)
13. **Multi-property support** — clients with multiple properties
14. **Calendar integration** — sync milestones with Google Calendar
15. **Two-factor auth** — SMS/TOTP for admin accounts
16. **Dark/light mode toggle** — the foundation is dark-first but a light option is common request
17. **Search** — global search across clients, documents, messages
18. **Bulk operations** — multi-select delete/archive on admin lists
19. **Client self-service** — allow clients to upload documents directly
20. **Automated reminders** — overdue invoice follow-ups via Resend

---

*End of handoff document.*
