/* ═══════════════════════════════════════════════════════
   GrapesJS — JR Advisory Custom Block Definitions
   Luxury dark theme blocks for the page builder.
   ═══════════════════════════════════════════════════════ */

import type { Editor } from 'grapesjs';

/* Shared base styles injected into the canvas */
export const CANVAS_STYLES = `
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

  .jr-btn--primary:hover {
    background: #d4b87e;
  }

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

export function registerBlocks(editor: Editor) {
  const bm = editor.BlockManager;

  /* ── LAYOUT ── */

  bm.add('jr-section', {
    label: 'Section',
    category: 'Layout',
    media: '<svg viewBox="0 0 24 24" width="38"><rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    content: `<section class="jr-section">
      <p class="jr-body">Drop content here...</p>
    </section>`,
  });

  bm.add('jr-two-col', {
    label: '2 Columns',
    category: 'Layout',
    media: '<svg viewBox="0 0 24 24" width="38"><rect x="2" y="4" width="9" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="13" y="4" width="9" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    content: `<section class="jr-section">
      <div class="jr-grid jr-grid--2">
        <div>
          <p class="jr-body">Left column content</p>
        </div>
        <div>
          <p class="jr-body">Right column content</p>
        </div>
      </div>
    </section>`,
  });

  bm.add('jr-three-col', {
    label: '3 Columns',
    category: 'Layout',
    media: '<svg viewBox="0 0 24 24" width="38"><rect x="1" y="4" width="6" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="4" width="6" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="17" y="4" width="6" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    content: `<section class="jr-section">
      <div class="jr-grid jr-grid--3">
        <div><p class="jr-body">Column 1</p></div>
        <div><p class="jr-body">Column 2</p></div>
        <div><p class="jr-body">Column 3</p></div>
      </div>
    </section>`,
  });

  bm.add('jr-spacer', {
    label: 'Spacer',
    category: 'Layout',
    media: '<svg viewBox="0 0 24 24" width="38"><line x1="4" y1="8" x2="20" y2="8" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3"/><line x1="4" y1="16" x2="20" y2="16" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3"/></svg>',
    content: '<div style="height: 80px;"></div>',
  });

  bm.add('jr-divider', {
    label: 'Divider',
    category: 'Layout',
    media: '<svg viewBox="0 0 24 24" width="38"><line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="1.5"/></svg>',
    content: '<div style="padding: 20px 40px;"><div class="jr-divider"></div></div>',
  });

  /* ── HERO ── */

  bm.add('jr-hero', {
    label: 'Hero',
    category: 'Sections',
    media: '<svg viewBox="0 0 24 24" width="38"><rect x="2" y="2" width="20" height="20" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="6" y1="8" x2="18" y2="8" stroke="currentColor" stroke-width="2"/><line x1="6" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="1"/><rect x="6" y="15" width="6" height="3" rx="1" fill="currentColor" opacity="0.4"/></svg>',
    content: `<section style="min-height: 100vh; display: flex; align-items: center; background: #0a0b0e; position: relative; overflow: hidden;">
      <div style="position: absolute; inset: 0; background: linear-gradient(135deg, rgba(201,169,110,0.03) 0%, transparent 60%);"></div>
      <div class="jr-section" style="position: relative; z-index: 1;">
        <div class="jr-eyebrow">Private Engagement · MMXXVI</div>
        <h1 class="jr-heading jr-heading--xl" style="margin-bottom: 32px;">
          Respond.<br><span class="jr-gold">Protect.</span><br>Restore.
        </h1>
        <p class="jr-body" style="margin-bottom: 48px;">
          Independent, client-side advisory for hazardous-material remediation oversight in luxury homes across the Westside.
        </p>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <a href="#" class="jr-btn jr-btn--ghost">Learn More →</a>
          <a href="#" class="jr-btn jr-btn--primary">Get Started →</a>
        </div>
      </div>
    </section>`,
  });

  bm.add('jr-hero-image', {
    label: 'Hero + Image',
    category: 'Sections',
    media: '<svg viewBox="0 0 24 24" width="38"><rect x="2" y="2" width="20" height="20" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="4" y1="8" x2="12" y2="8" stroke="currentColor" stroke-width="2"/><line x1="4" y1="11" x2="10" y2="11" stroke="currentColor" stroke-width="1"/><circle cx="17" cy="10" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    content: `<section style="min-height: 90vh; display: flex; align-items: center; background: #0a0b0e;">
      <div class="jr-section" style="width: 100%;">
        <div class="jr-grid jr-grid--2" style="align-items: center;">
          <div>
            <div class="jr-eyebrow">About Us</div>
            <h1 class="jr-heading jr-heading--lg" style="margin-bottom: 24px;">Your Headline Here</h1>
            <p class="jr-body" style="margin-bottom: 36px;">Add your description text here. Drag to replace with your own content.</p>
            <a href="#" class="jr-btn jr-btn--primary">Call to Action →</a>
          </div>
          <div style="aspect-ratio: 4/3; background: #161922; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(201,169,110,0.08);">
            <span style="color: rgba(236,230,214,0.2); font-family: 'JetBrains Mono', monospace; font-size: 11px;">Drop image here</span>
          </div>
        </div>
      </div>
    </section>`,
  });

  /* ── TEXT ── */

  bm.add('jr-text-section', {
    label: 'Text Block',
    category: 'Content',
    media: '<svg viewBox="0 0 24 24" width="38"><line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" stroke-width="2"/><line x1="4" y1="10" x2="18" y2="10" stroke="currentColor" stroke-width="1"/><line x1="4" y1="14" x2="16" y2="14" stroke="currentColor" stroke-width="1"/><line x1="4" y1="18" x2="12" y2="18" stroke="currentColor" stroke-width="1"/></svg>',
    content: `<section class="jr-section">
      <div class="jr-eyebrow">Section Label</div>
      <h2 class="jr-heading jr-heading--lg" style="margin-bottom: 24px;">Section Heading</h2>
      <p class="jr-body">
        Add your content here. This text block uses the JR Advisory design system with Cormorant Garamond headings and Inter body text on the luxury dark theme.
      </p>
    </section>`,
  });

  bm.add('jr-text-centered', {
    label: 'Centered Text',
    category: 'Content',
    media: '<svg viewBox="0 0 24 24" width="38"><line x1="6" y1="6" x2="18" y2="6" stroke="currentColor" stroke-width="2"/><line x1="4" y1="10" x2="20" y2="10" stroke="currentColor" stroke-width="1"/><line x1="5" y1="14" x2="19" y2="14" stroke="currentColor" stroke-width="1"/><line x1="8" y1="18" x2="16" y2="18" stroke="currentColor" stroke-width="1"/></svg>',
    content: `<section class="jr-section" style="text-align: center;">
      <div class="jr-eyebrow">Section Label</div>
      <h2 class="jr-heading jr-heading--lg" style="margin-bottom: 24px;">Centered Heading</h2>
      <p class="jr-body" style="margin-left: auto; margin-right: auto;">
        Centered body text for introductory sections, mission statements, or key messages.
      </p>
    </section>`,
  });

  /* ── CARDS / GRID ── */

  bm.add('jr-service-grid', {
    label: 'Service Grid',
    category: 'Content',
    media: '<svg viewBox="0 0 24 24" width="38"><rect x="2" y="2" width="9" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="13" y="2" width="9" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="13" width="9" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="13" y="13" width="9" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    content: `<section class="jr-section">
      <div style="text-align: center; margin-bottom: 60px;">
        <div class="jr-eyebrow">Our Services</div>
        <h2 class="jr-heading jr-heading--lg">What We Do</h2>
      </div>
      <div class="jr-grid jr-grid--3">
        <div class="jr-card">
          <div style="font-size: 32px; margin-bottom: 20px; color: #c9a96e;">◈</div>
          <h3 class="jr-heading jr-heading--sm" style="margin-bottom: 12px;">Service One</h3>
          <p class="jr-body">Description of the first service offering. Keep it concise and client-focused.</p>
        </div>
        <div class="jr-card">
          <div style="font-size: 32px; margin-bottom: 20px; color: #c9a96e;">◉</div>
          <h3 class="jr-heading jr-heading--sm" style="margin-bottom: 12px;">Service Two</h3>
          <p class="jr-body">Description of the second service offering.</p>
        </div>
        <div class="jr-card">
          <div style="font-size: 32px; margin-bottom: 20px; color: #c9a96e;">◎</div>
          <h3 class="jr-heading jr-heading--sm" style="margin-bottom: 12px;">Service Three</h3>
          <p class="jr-body">Description of the third service offering.</p>
        </div>
      </div>
    </section>`,
  });

  bm.add('jr-feature-card', {
    label: 'Feature Card',
    category: 'Content',
    media: '<svg viewBox="0 0 24 24" width="38"><rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="9" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="7" y1="15" x2="17" y2="15" stroke="currentColor" stroke-width="1"/><line x1="8" y1="18" x2="16" y2="18" stroke="currentColor" stroke-width="1"/></svg>',
    content: `<div class="jr-card">
      <div style="font-size: 28px; margin-bottom: 16px; color: #c9a96e;">◈</div>
      <h3 class="jr-heading jr-heading--sm" style="margin-bottom: 10px;">Feature Title</h3>
      <p class="jr-body">Feature description text goes here.</p>
    </div>`,
  });

  /* ── QUOTE / TESTIMONIAL ── */

  bm.add('jr-quote', {
    label: 'Quote',
    category: 'Content',
    media: '<svg viewBox="0 0 24 24" width="38"><path d="M10 8H6a2 2 0 00-2 2v2a2 2 0 002 2h1l-1 4h2l1-4a2 2 0 002-2v-2a2 2 0 00-2-2zm10 0h-4a2 2 0 00-2 2v2a2 2 0 002 2h1l-1 4h2l1-4a2 2 0 002-2v-2a2 2 0 00-2-2z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    content: `<section class="jr-section" style="text-align: center;">
      <div style="max-width: 800px; margin: 0 auto;">
        <div style="font-family: 'Cormorant Garamond', serif; font-size: 64px; color: rgba(201,169,110,0.2); line-height: 1; margin-bottom: 16px;">"</div>
        <blockquote style="font-family: 'Cormorant Garamond', serif; font-size: 24px; font-style: italic; color: rgba(236,230,214,0.8); line-height: 1.6; margin-bottom: 28px;">
          Your quote text goes here. Make it meaningful and impactful.
        </blockquote>
        <div class="jr-eyebrow" style="color: rgba(236,230,214,0.3);">— Author Name, Title</div>
      </div>
    </section>`,
  });

  /* ── CTA ── */

  bm.add('jr-cta-banner', {
    label: 'CTA Banner',
    category: 'Sections',
    media: '<svg viewBox="0 0 24 24" width="38"><rect x="2" y="6" width="20" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" stroke-width="1.5"/><rect x="6" y="13" width="5" height="2" rx="1" fill="currentColor" opacity="0.4"/></svg>',
    content: `<section style="background: linear-gradient(135deg, #101218 0%, #0a0b0e 100%); border-top: 1px solid rgba(201,169,110,0.1); border-bottom: 1px solid rgba(201,169,110,0.1);">
      <div class="jr-section" style="text-align: center;">
        <h2 class="jr-heading jr-heading--lg" style="margin-bottom: 16px;">Ready to Get Started?</h2>
        <p class="jr-body" style="margin: 0 auto 36px;">Take the next step. No obligation, completely confidential.</p>
        <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
          <a href="#" class="jr-btn jr-btn--primary">Schedule a Call →</a>
          <a href="#" class="jr-btn jr-btn--ghost">Learn More</a>
        </div>
      </div>
    </section>`,
  });

  /* ── IMAGE ── */

  bm.add('jr-image-text', {
    label: 'Image + Text',
    category: 'Content',
    media: '<svg viewBox="0 0 24 24" width="38"><rect x="2" y="4" width="10" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="15" y1="7" x2="22" y2="7" stroke="currentColor" stroke-width="1.5"/><line x1="15" y1="10" x2="22" y2="10" stroke="currentColor" stroke-width="1"/><line x1="15" y1="13" x2="20" y2="13" stroke="currentColor" stroke-width="1"/></svg>',
    content: `<section class="jr-section">
      <div class="jr-grid jr-grid--2" style="align-items: center; gap: 60px;">
        <div style="aspect-ratio: 4/3; background: #161922; border-radius: 8px; overflow: hidden; border: 1px solid rgba(201,169,110,0.08); display: flex; align-items: center; justify-content: center;">
          <span style="color: rgba(236,230,214,0.2); font-family: 'JetBrains Mono', monospace; font-size: 11px;">Drop image here</span>
        </div>
        <div>
          <div class="jr-eyebrow">About</div>
          <h2 class="jr-heading jr-heading--md" style="margin-bottom: 20px;">Heading Text</h2>
          <p class="jr-body">Pair your image with descriptive text. This layout works great for about sections, team introductions, or project showcases.</p>
        </div>
      </div>
    </section>`,
  });

  bm.add('jr-gallery', {
    label: 'Image Gallery',
    category: 'Content',
    media: '<svg viewBox="0 0 24 24" width="38"><rect x="2" y="2" width="9" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="13" y="2" width="9" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="13" width="9" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="13" y="13" width="9" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    content: `<section class="jr-section">
      <div style="text-align: center; margin-bottom: 48px;">
        <div class="jr-eyebrow">Gallery</div>
        <h2 class="jr-heading jr-heading--lg">Our Work</h2>
      </div>
      <div class="jr-grid jr-grid--3" style="gap: 16px;">
        <div style="aspect-ratio: 1; background: #161922; border-radius: 6px; border: 1px solid rgba(201,169,110,0.06); display: flex; align-items: center; justify-content: center;"><span style="color: rgba(236,230,214,0.15); font-size: 11px; font-family: 'JetBrains Mono', monospace;">Image 1</span></div>
        <div style="aspect-ratio: 1; background: #161922; border-radius: 6px; border: 1px solid rgba(201,169,110,0.06); display: flex; align-items: center; justify-content: center;"><span style="color: rgba(236,230,214,0.15); font-size: 11px; font-family: 'JetBrains Mono', monospace;">Image 2</span></div>
        <div style="aspect-ratio: 1; background: #161922; border-radius: 6px; border: 1px solid rgba(201,169,110,0.06); display: flex; align-items: center; justify-content: center;"><span style="color: rgba(236,230,214,0.15); font-size: 11px; font-family: 'JetBrains Mono', monospace;">Image 3</span></div>
        <div style="aspect-ratio: 1; background: #161922; border-radius: 6px; border: 1px solid rgba(201,169,110,0.06); display: flex; align-items: center; justify-content: center;"><span style="color: rgba(236,230,214,0.15); font-size: 11px; font-family: 'JetBrains Mono', monospace;">Image 4</span></div>
        <div style="aspect-ratio: 1; background: #161922; border-radius: 6px; border: 1px solid rgba(201,169,110,0.06); display: flex; align-items: center; justify-content: center;"><span style="color: rgba(236,230,214,0.15); font-size: 11px; font-family: 'JetBrains Mono', monospace;">Image 5</span></div>
        <div style="aspect-ratio: 1; background: #161922; border-radius: 6px; border: 1px solid rgba(201,169,110,0.06); display: flex; align-items: center; justify-content: center;"><span style="color: rgba(236,230,214,0.15); font-size: 11px; font-family: 'JetBrains Mono', monospace;">Image 6</span></div>
      </div>
    </section>`,
  });

  /* ── VIDEO ── */

  bm.add('jr-video', {
    label: 'Video Embed',
    category: 'Media',
    media: '<svg viewBox="0 0 24 24" width="38"><rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><polygon points="10,8 10,16 16,12" fill="currentColor" opacity="0.4"/></svg>',
    content: `<section class="jr-section" style="text-align: center;">
      <div style="max-width: 800px; margin: 0 auto;">
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; border: 1px solid rgba(201,169,110,0.1); background: #101218;">
          <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allowfullscreen></iframe>
        </div>
      </div>
    </section>`,
  });

  /* ── CONTACT ── */

  bm.add('jr-contact', {
    label: 'Contact Form',
    category: 'Sections',
    media: '<svg viewBox="0 0 24 24" width="38"><rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="6" y1="8" x2="18" y2="8" stroke="currentColor" stroke-width="1"/><line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="1"/><line x1="6" y1="16" x2="12" y2="16" stroke="currentColor" stroke-width="1"/></svg>',
    content: `<section class="jr-section" style="text-align: center;">
      <div style="max-width: 600px; margin: 0 auto;">
        <div class="jr-eyebrow">Contact</div>
        <h2 class="jr-heading jr-heading--lg" style="margin-bottom: 16px;">Get in Touch</h2>
        <p class="jr-body" style="margin: 0 auto 40px;">We'd love to hear from you. Fill out the form below and we'll get back to you promptly.</p>
        <form style="display: flex; flex-direction: column; gap: 16px; text-align: left;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <input type="text" placeholder="First Name" style="padding: 14px 18px; background: #101218; border: 1px solid rgba(201,169,110,0.12); border-radius: 6px; color: #ece6d6; font-family: 'Inter', sans-serif; font-size: 14px; outline: none;" />
            <input type="text" placeholder="Last Name" style="padding: 14px 18px; background: #101218; border: 1px solid rgba(201,169,110,0.12); border-radius: 6px; color: #ece6d6; font-family: 'Inter', sans-serif; font-size: 14px; outline: none;" />
          </div>
          <input type="email" placeholder="Email Address" style="padding: 14px 18px; background: #101218; border: 1px solid rgba(201,169,110,0.12); border-radius: 6px; color: #ece6d6; font-family: 'Inter', sans-serif; font-size: 14px; outline: none;" />
          <textarea placeholder="Your Message" rows="5" style="padding: 14px 18px; background: #101218; border: 1px solid rgba(201,169,110,0.12); border-radius: 6px; color: #ece6d6; font-family: 'Inter', sans-serif; font-size: 14px; outline: none; resize: vertical;"></textarea>
          <button type="submit" class="jr-btn jr-btn--primary" style="width: 100%; justify-content: center;">Send Message →</button>
        </form>
      </div>
    </section>`,
  });

  /* ── FAQ ── */

  bm.add('jr-faq', {
    label: 'FAQ Section',
    category: 'Content',
    media: '<svg viewBox="0 0 24 24" width="38"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><text x="12" y="16" text-anchor="middle" fill="currentColor" font-size="12" font-weight="bold">?</text></svg>',
    content: `<section class="jr-section">
      <div style="text-align: center; margin-bottom: 60px;">
        <div class="jr-eyebrow">FAQ</div>
        <h2 class="jr-heading jr-heading--lg">Frequently Asked Questions</h2>
      </div>
      <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 2px;">
        <details style="background: #101218; border: 1px solid rgba(201,169,110,0.08); border-radius: 8px; overflow: hidden;">
          <summary style="padding: 20px 24px; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 500; color: #ece6d6; list-style: none; display: flex; justify-content: space-between; align-items: center;">
            What is your first question?
          </summary>
          <div style="padding: 0 24px 20px;">
            <p class="jr-body">Your answer goes here. Provide clear, helpful information.</p>
          </div>
        </details>
        <details style="background: #101218; border: 1px solid rgba(201,169,110,0.08); border-radius: 8px; overflow: hidden;">
          <summary style="padding: 20px 24px; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 500; color: #ece6d6; list-style: none;">
            What is your second question?
          </summary>
          <div style="padding: 0 24px 20px;">
            <p class="jr-body">Another helpful answer here.</p>
          </div>
        </details>
        <details style="background: #101218; border: 1px solid rgba(201,169,110,0.08); border-radius: 8px; overflow: hidden;">
          <summary style="padding: 20px 24px; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 500; color: #ece6d6; list-style: none;">
            What is your third question?
          </summary>
          <div style="padding: 0 24px 20px;">
            <p class="jr-body">Third answer goes here.</p>
          </div>
        </details>
      </div>
    </section>`,
  });

  /* ── FOOTER ── */

  bm.add('jr-footer', {
    label: 'Footer',
    category: 'Sections',
    media: '<svg viewBox="0 0 24 24" width="38"><rect x="2" y="14" width="20" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="6" y1="17" x2="10" y2="17" stroke="currentColor" stroke-width="1"/><line x1="14" y1="17" x2="18" y2="17" stroke="currentColor" stroke-width="1"/></svg>',
    content: `<footer style="background: #070708; border-top: 1px solid rgba(201,169,110,0.08); padding: 60px 40px 40px;">
      <div style="max-width: 1200px; margin: 0 auto;">
        <div class="jr-grid jr-grid--3" style="margin-bottom: 48px;">
          <div>
            <h4 class="jr-heading jr-heading--sm" style="margin-bottom: 8px;">Company Name</h4>
            <p class="jr-body" style="font-size: 13px;">Brief description of what your company does.</p>
          </div>
          <div>
            <div class="jr-eyebrow" style="margin-bottom: 16px;">Quick Links</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <a href="#" style="color: rgba(236,230,214,0.5); text-decoration: none; font-size: 14px;">About</a>
              <a href="#" style="color: rgba(236,230,214,0.5); text-decoration: none; font-size: 14px;">Services</a>
              <a href="#" style="color: rgba(236,230,214,0.5); text-decoration: none; font-size: 14px;">Contact</a>
            </div>
          </div>
          <div>
            <div class="jr-eyebrow" style="margin-bottom: 16px;">Contact</div>
            <div style="display: flex; flex-direction: column; gap: 8px; color: rgba(236,230,214,0.5); font-size: 14px;">
              <span>email@example.com</span>
              <span>(310) 000-0000</span>
            </div>
          </div>
        </div>
        <div class="jr-divider" style="margin-bottom: 24px;"></div>
        <p style="text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: rgba(236,230,214,0.2); letter-spacing: 0.1em;">© 2026 Company Name. All rights reserved.</p>
      </div>
    </footer>`,
  });

  /* ── BASIC ELEMENTS ── */

  bm.add('jr-button', {
    label: 'Button',
    category: 'Elements',
    media: '<svg viewBox="0 0 24 24" width="38"><rect x="4" y="8" width="16" height="8" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="1"/></svg>',
    content: '<a href="#" class="jr-btn jr-btn--primary">Button Text →</a>',
  });

  bm.add('jr-button-ghost', {
    label: 'Ghost Button',
    category: 'Elements',
    media: '<svg viewBox="0 0 24 24" width="38"><rect x="4" y="8" width="16" height="8" rx="3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="1"/></svg>',
    content: '<a href="#" class="jr-btn jr-btn--ghost">Button Text →</a>',
  });

  bm.add('jr-heading-block', {
    label: 'Heading',
    category: 'Elements',
    media: '<svg viewBox="0 0 24 24" width="38"><text x="4" y="17" fill="currentColor" font-size="16" font-weight="bold">H</text></svg>',
    content: '<h2 class="jr-heading jr-heading--lg">Your Heading</h2>',
  });

  bm.add('jr-paragraph', {
    label: 'Paragraph',
    category: 'Elements',
    media: '<svg viewBox="0 0 24 24" width="38"><line x1="4" y1="7" x2="20" y2="7" stroke="currentColor" stroke-width="1"/><line x1="4" y1="11" x2="18" y2="11" stroke="currentColor" stroke-width="1"/><line x1="4" y1="15" x2="16" y2="15" stroke="currentColor" stroke-width="1"/></svg>',
    content: '<p class="jr-body">Your paragraph text goes here.</p>',
  });

  bm.add('jr-image', {
    label: 'Image',
    category: 'Media',
    media: '<svg viewBox="0 0 24 24" width="38"><rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.4"/><polyline points="3 16 8 11 21 21" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    content: { type: 'image' },
    activate: true,
  });
}
