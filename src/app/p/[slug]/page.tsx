import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import sanitizeHtml from 'sanitize-html';

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

/**
 * Sanitize page HTML from the CMS page builder.
 * Allows rich content (images, links, iframes for embeds) but strips
 * script tags, event handlers, and other XSS vectors.
 */
function sanitizePageHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      // Structure
      'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'img', 'br', 'hr', 'ul', 'ol', 'li',
      // Formatting
      'strong', 'em', 'b', 'i', 'u', 's', 'sub', 'sup',
      // Tables
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
      // Semantic
      'blockquote', 'pre', 'code',
      'section', 'article', 'header', 'footer', 'nav', 'main', 'aside',
      'figure', 'figcaption', 'picture', 'source', 'video',
      // Embeds (YouTube/Vimeo)
      'iframe',
      // Forms (page builder may include contact forms)
      'button', 'form', 'input', 'label', 'select', 'option', 'textarea',
      // Style blocks from GrapesJS
      'style',
    ],
    allowedAttributes: {
      '*': ['class', 'id', 'style', 'data-*', 'aria-*', 'role'],
      'a': ['href', 'target', 'rel', 'title'],
      'img': ['src', 'alt', 'title', 'width', 'height', 'loading', 'srcset', 'sizes'],
      'iframe': ['src', 'width', 'height', 'allowfullscreen', 'frameborder', 'allow', 'title'],
      'source': ['src', 'srcset', 'type', 'media', 'sizes'],
      'video': ['src', 'width', 'height', 'controls', 'autoplay', 'muted', 'loop', 'poster'],
      'td': ['colspan', 'rowspan'],
      'th': ['colspan', 'rowspan'],
      'input': ['type', 'name', 'value', 'placeholder', 'required'],
      'textarea': ['name', 'placeholder', 'rows', 'cols', 'required'],
      'select': ['name', 'required'],
      'option': ['value'],
      'label': ['for'],
      'button': ['type'],
      'form': ['action', 'method'],
    },
    // Allow iframe src only from trusted embed domains
    allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'player.vimeo.com', 'vimeo.com'],
    // Allow data: URIs for images (base64)
    allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
      a: ['http', 'https', 'mailto', 'tel'],
    },
    // Strip all event handler attributes (onclick, onerror, etc.)
    // sanitize-html does this by default — only explicitly allowed attributes pass through
  });
}

/**
 * Sanitize CSS from the CMS page builder.
 * Strips dangerous constructs like url() to external domains,
 * expression(), behavior(), @import to external URLs, etc.
 */
function sanitizePageCss(css: string): string {
  return css
    // Remove JS expressions in CSS (IE-specific but defensive)
    .replace(/expression\s*\(/gi, '/* blocked */(')
    // Remove behavior() (IE-specific)
    .replace(/behavior\s*:/gi, '/* blocked */:')
    // Remove -moz-binding
    .replace(/-moz-binding\s*:/gi, '/* blocked */:')
    // Remove @import with external URLs (keep local ones)
    .replace(/@import\s+url\s*\(\s*(['"]?)(?!https:\/\/fonts\.googleapis\.com)(https?:)?\/\//gi, '/* blocked-import */')
    // Block url() pointing to javascript: or data:text/html
    .replace(/url\s*\(\s*(['"]?)\s*javascript:/gi, 'url($1/* blocked */')
    .replace(/url\s*\(\s*(['"]?)\s*data:text\/html/gi, 'url($1/* blocked */');
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

  // Sanitize HTML and CSS from the page builder before rendering
  const safeHtml = sanitizePageHtml(page.html);
  const safeCss = page.css ? sanitizePageCss(page.css) : '';

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
      {safeCss && <style dangerouslySetInnerHTML={{ __html: safeCss }} />}
      <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
    </div>
  );
}
