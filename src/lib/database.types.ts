/* ── Generated Supabase Types ── */
/* Mirrors the SQL schema in supabase/migrations/001_initial_schema.sql */

export type ClientStatus = 'active' | 'pending' | 'completed' | 'archived';
export type EngagementPhase = '1' | '2' | '3' | '4';
export type DocCategory = 'nda' | 'lab-results' | 'proposals' | 'clearance' | 'invoices' | 'reports';
export type DocStatus = 'final' | 'draft' | 'pending-review';
export type MsgSender = 'firm' | 'client';
export type TimelineType = 'milestone' | 'document' | 'meeting' | 'update';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type UserRole = 'admin' | 'client';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  profile_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  property: string;
  area: string;
  status: ClientStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Engagement {
  id: string;
  client_id: string;
  type: string;
  phase: EngagementPhase;
  phase_label: string;
  start_date: string;
  next_milestone: string | null;
  property: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  client_id: string;
  engagement_id: string;
  name: string;
  category: DocCategory;
  status: DocStatus;
  file_path: string | null;
  file_size: string | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  client_id: string;
  engagement_id: string;
  sender_type: MsgSender;
  sender_name: string;
  subject: string;
  body: string;
  read: boolean;
  encrypted: boolean;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  engagement_id: string;
  phase: EngagementPhase;
  title: string;
  description: string | null;
  event_type: TimelineType;
  event_date: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  client_id: string;
  engagement_id: string;
  invoice_number: string;
  description: string;
  amount: number;
  status: InvoiceStatus;
  due_date: string;
  paid_date: string | null;
  pdf_path: string | null;
  notes: string | null;
  stripe_session_id: string | null;
  stripe_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface NdaRecord {
  id: string;
  client_id: string;
  engagement_id: string | null;
  signed_date: string;
  expires_date: string | null;
  document_id: string | null;
  status: string;
  created_at: string;
}

/* Supabase generic Database type */
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; full_name: string; email: string }; Update: Partial<Profile> };
      clients: { Row: Client; Insert: Partial<Client> & { name: string; email: string; property: string; area: string }; Update: Partial<Client> };
      engagements: { Row: Engagement; Insert: Partial<Engagement> & { client_id: string; type: string; property: string }; Update: Partial<Engagement> };
      documents: { Row: Document; Insert: Partial<Document> & { client_id: string; engagement_id: string; name: string; category: DocCategory }; Update: Partial<Document> };
      messages: { Row: Message; Insert: Partial<Message> & { client_id: string; engagement_id: string; sender_type: MsgSender; sender_name: string; subject: string; body: string }; Update: Partial<Message> };
      timeline_events: { Row: TimelineEvent; Insert: Partial<TimelineEvent> & { engagement_id: string; phase: EngagementPhase; title: string }; Update: Partial<TimelineEvent> };
      invoices: { Row: Invoice; Insert: Partial<Invoice> & { client_id: string; engagement_id: string; invoice_number: string; description: string; amount: number; due_date: string }; Update: Partial<Invoice> };
      audit_log: { Row: AuditLogEntry; Insert: Partial<AuditLogEntry> & { action: string; entity_type: string }; Update: Partial<AuditLogEntry> };
      nda_records: { Row: NdaRecord; Insert: Partial<NdaRecord> & { client_id: string; signed_date: string }; Update: Partial<NdaRecord> };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      my_client_ids: { Args: Record<string, never>; Returns: string[] };
    };
  };
}
