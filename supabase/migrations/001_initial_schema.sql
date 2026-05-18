/* ──────────────────────────────────────────────────────
   JR Advisory — Database Schema
   Run once in Supabase SQL Editor after project creation
   ────────────────────────────────────────────────────── */

-- Enable UUID extension
create extension if not exists "uuid-ossp";

/* ── ENUMS ── */
create type client_status  as enum ('active', 'pending', 'completed', 'archived');
create type engagement_phase as enum ('1', '2', '3', '4');
create type doc_category   as enum ('nda', 'lab-results', 'proposals', 'clearance', 'invoices', 'reports');
create type doc_status     as enum ('final', 'draft', 'pending-review');
create type msg_sender     as enum ('firm', 'client');
create type timeline_type  as enum ('milestone', 'document', 'meeting', 'update');
create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'cancelled');
create type user_role      as enum ('admin', 'client');

/* ── PROFILES (extends Supabase Auth) ── */
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'client',
  full_name   text not null,
  email       text not null unique,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

/* ── CLIENTS ── */
create table clients (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid references profiles(id) on delete set null,
  name        text not null,
  email       text not null,
  phone       text,
  property    text not null,
  area        text not null,
  status      client_status not null default 'pending',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

/* ── ENGAGEMENTS ── */
create table engagements (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid not null references clients(id) on delete cascade,
  type            text not null,
  phase           engagement_phase not null default '1',
  phase_label     text not null default 'Confidential Consultation',
  start_date      date not null default current_date,
  next_milestone  text,
  property        text not null,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

/* ── DOCUMENTS ── */
create table documents (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid not null references clients(id) on delete cascade,
  engagement_id   uuid not null references engagements(id) on delete cascade,
  name            text not null,
  category        doc_category not null,
  status          doc_status not null default 'draft',
  file_path       text,          -- Supabase Storage path
  file_size       text,
  mime_type       text,
  uploaded_by     uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

/* ── MESSAGES ── */
create table messages (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid not null references clients(id) on delete cascade,
  engagement_id   uuid not null references engagements(id) on delete cascade,
  sender_type     msg_sender not null,
  sender_name     text not null,
  subject         text not null,
  body            text not null,
  read            boolean not null default false,
  encrypted       boolean not null default true,
  created_at      timestamptz not null default now()
);

/* ── TIMELINE ── */
create table timeline_events (
  id              uuid primary key default uuid_generate_v4(),
  engagement_id   uuid not null references engagements(id) on delete cascade,
  phase           engagement_phase not null,
  title           text not null,
  description     text,
  event_type      timeline_type not null default 'update',
  event_date      date not null default current_date,
  created_at      timestamptz not null default now()
);

/* ── INVOICES ── */
create table invoices (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid not null references clients(id) on delete cascade,
  engagement_id   uuid not null references engagements(id) on delete cascade,
  invoice_number  text not null unique,
  description     text not null,
  amount          numeric(12,2) not null,
  status          invoice_status not null default 'draft',
  due_date        date not null,
  paid_date       date,
  pdf_path        text,          -- Supabase Storage path
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

/* ── AUDIT LOG ── */
create table audit_log (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id),
  action      text not null,    -- e.g. 'document.viewed', 'phase.updated', 'message.sent'
  entity_type text not null,    -- e.g. 'document', 'engagement', 'message'
  entity_id   uuid,
  metadata    jsonb,            -- additional context
  ip_address  inet,
  created_at  timestamptz not null default now()
);

/* ── NDA TRACKING ── */
create table nda_records (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid not null references clients(id) on delete cascade,
  engagement_id   uuid references engagements(id) on delete set null,
  signed_date     date not null,
  expires_date    date,
  document_id     uuid references documents(id) on delete set null,
  status          text not null default 'active', -- active, expired, revoked
  created_at      timestamptz not null default now()
);

/* ── INDEXES ── */
create index idx_clients_profile    on clients(profile_id);
create index idx_clients_status     on clients(status);
create index idx_engagements_client on engagements(client_id);
create index idx_engagements_phase  on engagements(phase);
create index idx_documents_client   on documents(client_id);
create index idx_documents_eng      on documents(engagement_id);
create index idx_messages_client    on messages(client_id);
create index idx_messages_read      on messages(read);
create index idx_timeline_eng       on timeline_events(engagement_id);
create index idx_invoices_client    on invoices(client_id);
create index idx_invoices_status    on invoices(status);
create index idx_audit_user         on audit_log(user_id);
create index idx_audit_entity       on audit_log(entity_type, entity_id);
create index idx_audit_created      on audit_log(created_at);
create index idx_nda_client         on nda_records(client_id);
create index idx_nda_expires        on nda_records(expires_date);

/* ── ROW-LEVEL SECURITY ── */
alter table profiles        enable row level security;
alter table clients          enable row level security;
alter table engagements      enable row level security;
alter table documents        enable row level security;
alter table messages         enable row level security;
alter table timeline_events  enable row level security;
alter table invoices         enable row level security;
alter table audit_log        enable row level security;
alter table nda_records      enable row level security;

-- Helper: check if user is admin
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- Helper: get client IDs the current user can access
create or replace function my_client_ids()
returns setof uuid as $$
  select id from clients where profile_id = auth.uid()
$$ language sql security definer;

/* ── PROFILES policies ── */
create policy "Users can read own profile"
  on profiles for select using (id = auth.uid());
create policy "Admins can read all profiles"
  on profiles for select using (is_admin());
create policy "Admins can manage profiles"
  on profiles for all using (is_admin());

/* ── CLIENTS policies ── */
create policy "Clients see own record"
  on clients for select using (profile_id = auth.uid());
create policy "Admins full access to clients"
  on clients for all using (is_admin());

/* ── ENGAGEMENTS policies ── */
create policy "Clients see own engagements"
  on engagements for select using (client_id in (select my_client_ids()));
create policy "Admins full access to engagements"
  on engagements for all using (is_admin());

/* ── DOCUMENTS policies ── */
create policy "Clients see own documents"
  on documents for select using (client_id in (select my_client_ids()));
create policy "Admins full access to documents"
  on documents for all using (is_admin());

/* ── MESSAGES policies ── */
create policy "Clients see own messages"
  on messages for select using (client_id in (select my_client_ids()));
create policy "Clients can send messages"
  on messages for insert with check (
    client_id in (select my_client_ids()) and sender_type = 'client'
  );
create policy "Admins full access to messages"
  on messages for all using (is_admin());

/* ── TIMELINE policies ── */
create policy "Clients see own timeline"
  on timeline_events for select using (
    engagement_id in (select id from engagements where client_id in (select my_client_ids()))
  );
create policy "Admins full access to timeline"
  on timeline_events for all using (is_admin());

/* ── INVOICES policies ── */
create policy "Clients see own invoices"
  on invoices for select using (client_id in (select my_client_ids()));
create policy "Admins full access to invoices"
  on invoices for all using (is_admin());

/* ── AUDIT LOG policies ── */
create policy "Admins can read audit log"
  on audit_log for select using (is_admin());
create policy "System can insert audit log"
  on audit_log for insert with check (true);

/* ── NDA policies ── */
create policy "Clients see own NDAs"
  on nda_records for select using (client_id in (select my_client_ids()));
create policy "Admins full access to NDAs"
  on nda_records for all using (is_admin());

/* ── UPDATED_AT TRIGGER ── */
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on profiles       for each row execute function update_updated_at();
create trigger set_updated_at before update on clients        for each row execute function update_updated_at();
create trigger set_updated_at before update on engagements    for each row execute function update_updated_at();
create trigger set_updated_at before update on documents      for each row execute function update_updated_at();
create trigger set_updated_at before update on invoices       for each row execute function update_updated_at();

/* ── AUTO-CREATE PROFILE ON SIGNUP ── */
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

/* ── STORAGE BUCKETS ── */
-- Run in Supabase dashboard > Storage > Create Bucket:
-- 1. "documents" — private, 50MB file limit
-- 2. "invoices" — private, 10MB file limit
-- Or via SQL:
insert into storage.buckets (id, name, public) values ('documents', 'documents', false);
insert into storage.buckets (id, name, public) values ('invoices', 'invoices', false);

-- Storage policies
create policy "Clients can read own documents"
  on storage.objects for select using (
    bucket_id = 'documents' and
    (storage.foldername(name))[1] in (
      select id::text from clients where profile_id = auth.uid()
    )
  );
create policy "Admins can manage all documents"
  on storage.objects for all using (
    bucket_id in ('documents', 'invoices') and is_admin()
  );
