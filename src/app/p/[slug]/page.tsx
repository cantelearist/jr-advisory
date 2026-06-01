import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

interface PageData {
  id: string;
  title: string;
  slug: string;
  html: string;
  css: string;
  status: string;
  meta_title: string | null;
  meta_description: string | null;
}

async function getPage(slug: string): Promise<PageData | null> {
  if (!isSupabaseConfigured()) return null;

  const { data } = await getSupabase()
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  return data as PageData | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    return { title: 'Page Not Found' };
  }

  return {
    title: page.meta_title || page.title,
    description: page.meta_description || undefined,
  };
}

export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  // Base styles for the rendered page (same as the editor canvas)
  const baseStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', sans-serif;
      color: #ece6d6;
      background: #0a0b0e;
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
    }

    .jr-section {
      padding: 100px 40px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .jr-section--full {
      max-width: none;
      padding-left: 0;
      padding-right: 0;
    }

    .jr-eyebrow {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #c9a96e;
      margin-bottom: 20px;
    }

    .jr-heading {
      font-family: 'Cormorant Garamond', serif;
      font-weight: 300;
      line-height: 1.1;
      color: #ece6d6;
    }

    .jr-heading--xl { font-size: 72px; }
    .jr-heading--lg { font-size: 48px; }
    .jr-heading--md { font-size: 36px; }
    .jr-heading--sm { font-size: 28px; }

    .jr-body {
      font-family: 'Inter', sans-serif;
      font-size: 15px;
      color: rgba(236, 230, 214, 0.6);
      line-height: 1.8;
      max-width: 60ch;
    }

    .jr-gold { color: #c9a96e; }

    .jr-btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .jr-btn--primary {
      background: #c9a96e;
      color: #0a0b0e;
      border: 1px solid #c9a96e;
    }

    .jr-btn--primary:hover { background: #d4b87e; }

    .jr-btn--ghost {
      background: transparent;
      color: #ece6d6;
      border: 1px solid rgba(201, 169, 110, 0.25);
    }

    .jr-btn--ghost:hover {
      border-color: #c9a96e;
      color: #c9a96e;
    }

    .jr-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(201, 169, 110, 0.2), transparent);
      margin: 0 auto;
      width: 100%;
    }

    .jr-card {
      background: #101218;
      border: 1px solid rgba(201, 169, 110, 0.08);
      border-radius: 8px;
      padding: 40px;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }

    .jr-card:hover {
      border-color: rgba(201, 169, 110, 0.2);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
    }

    .jr-grid { display: grid; gap: 24px; }
    .jr-grid--2 { grid-template-columns: repeat(2, 1fr); }
    .jr-grid--3 { grid-template-columns: repeat(3, 1fr); }

    @media (max-width: 768px) {
      .jr-section { padding: 60px 20px; }
      .jr-heading--xl { font-size: 44px; }
      .jr-heading--lg { font-size: 32px; }
      .jr-grid--2, .jr-grid--3 { grid-template-columns: 1fr; }
    }

    img { max-width: 100%; height: auto; }
  `;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b0e' }}>
      <style dangerouslySetInnerHTML={{ __html: baseStyles }} />
      {page.css && <style dangerouslySetInnerHTML={{ __html: page.css }} />}
      <div dangerouslySetInnerHTML={{ __html: page.html }} />
    </div>
  );
}
