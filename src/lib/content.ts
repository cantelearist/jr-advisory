/* ── Content Management System ── */
/* Editable site content: requires Supabase. Falls back to defaults for reads (not localStorage). */

import { getSupabase, isSupabaseConfigured } from './supabase';

export interface ContentBlock {
  id: string;
  section: string;       // e.g. 'hero', 'practice', 'founders'
  key: string;           // e.g. 'tagline', 'description', 'roman_quote'
  label: string;         // Human-readable label for the editor
  content: string;       // The actual content (HTML or plain text)
  content_type: 'text' | 'html' | 'markdown';
  updated_at: string;
  updated_by: string | null;
}

/* ── Default content blocks (mirrors constants.ts) ── */
export const DEFAULT_CONTENT: ContentBlock[] = [
  // Hero
  { id: 'hero_tagline', section: 'hero', key: 'tagline', label: 'Hero Tagline', content: 'Respond. Protect. Restore.', content_type: 'text', updated_at: '', updated_by: null },
  { id: 'hero_description', section: 'hero', key: 'description', label: 'Hero Description', content: 'Independent, client-side advisory for hazardous-material remediation oversight and property-integrity matters in luxury homes across the Westside.', content_type: 'text', updated_at: '', updated_by: null },

  // Practice
  { id: 'practice_intro', section: 'practice', key: 'intro', label: 'Practice Introduction', content: 'We represent the homeowner — never the contractor, never the insurer, never the vendor. Our role is to see clearly, advise independently, and ensure the work meets the standard your home and family deserve.', content_type: 'html', updated_at: '', updated_by: null },

  // Founders
  { id: 'founders_stephen_quote', section: 'founders', key: 'stephen_quote', label: 'Stephen — Quote', content: 'I was born in Malibu. I\u2019ve lost my house to fire twice in my lifetime. I\u2019m not advising from the comfortable other side of the experience\u2009\u2014\u2009I\u2019m in the middle of it. Same as a lot of my neighbors. When somebody walks back onto their property and a stranger in a hard hat hands them a clipboard and a number, they deserve somebody on their side who has actually stood where they\u2019re standing. I have. I still am.', content_type: 'text', updated_at: '', updated_by: null },
  { id: 'founders_roman_quote', section: 'founders', key: 'roman_quote', label: 'Roman — Quote', content: 'I arrived in Santa Monica in 2010 and never really left. Then the fires came, and it all became too personal. Friends lost houses. My daughter\u2019s school was in ashes. You can\u2019t pretend, after that, that you\u2019re doing this work for anyone but the people living it. I oversee construction across LA every day\u2009\u2014\u2009I see how corners get cut and how the homeowner is left with the consequences. It\u2019s why we started this. Not someday. Now.', content_type: 'text', updated_at: '', updated_by: null },
  { id: 'founders_stephen_title', section: 'founders', key: 'stephen_title', label: 'Stephen — Title', content: 'CO-FOUNDER', content_type: 'text', updated_at: '', updated_by: null },
  { id: 'founders_roman_title', section: 'founders', key: 'roman_title', label: 'Roman — Title', content: 'CO-FOUNDER', content_type: 'text', updated_at: '', updated_by: null },

  // Contact
  { id: 'contact_heading', section: 'contact', key: 'heading', label: 'Contact Heading', content: 'Begin a Private Consultation', content_type: 'text', updated_at: '', updated_by: null },
  { id: 'contact_description', section: 'contact', key: 'description', label: 'Contact Description', content: 'Every engagement begins with a confidential conversation. No cost. No obligation. No information shared without a signed NDA.', content_type: 'text', updated_at: '', updated_by: null },

  // Discretion
  { id: 'discretion_intro', section: 'discretion', key: 'intro', label: 'Discretion Introduction', content: 'Your home. Your family. Your privacy. These are not negotiable — they are the foundation of every engagement.', content_type: 'html', updated_at: '', updated_by: null },
];

/* ── Public API ── */

export async function fetchAllContent(): Promise<ContentBlock[]> {
  if (!isSupabaseConfigured()) {
    // For marketing pages that need to render during build/SSG, return defaults
    return DEFAULT_CONTENT;
  }
  const { data } = await getSupabase()
    .from('site_content')
    .select('*')
    .order('section', { ascending: true });
  if (!data || data.length === 0) return DEFAULT_CONTENT;
  return data as ContentBlock[];
}

export async function fetchContent(section: string, key: string): Promise<string> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_CONTENT.find(b => b.section === section && b.key === key)?.content || '';
  }
  const { data } = await getSupabase()
    .from('site_content')
    .select('content')
    .eq('section', section)
    .eq('key', key)
    .single();
  if (data) return (data as { content: string }).content;
  return DEFAULT_CONTENT.find(b => b.section === section && b.key === key)?.content || '';
}

export async function updateContent(
  id: string,
  content: string,
  updatedBy?: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Cannot update content.');
  }
  const now = new Date().toISOString();
  await getSupabase()
    .from('site_content')
    .upsert({ id, content, updated_at: now, updated_by: updatedBy } as Record<string, unknown>);
}

export async function resetContent(): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Cannot reset content.');
  }
  await getSupabase().from('site_content').delete().neq('id', '');
}

/* ── Section grouping helper ── */
export function groupBySection(blocks: ContentBlock[]): Record<string, ContentBlock[]> {
  return blocks.reduce((acc, block) => {
    if (!acc[block.section]) acc[block.section] = [];
    acc[block.section].push(block);
    return acc;
  }, {} as Record<string, ContentBlock[]>);
}

export const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero Section',
  practice: 'The Practice',
  founders: 'Founders',
  contact: 'Contact',
  discretion: 'Discretion',
};
