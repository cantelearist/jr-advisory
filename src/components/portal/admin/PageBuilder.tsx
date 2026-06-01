'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Editor } from 'grapesjs';
import { registerBlocks, CANVAS_STYLES } from './editor/blocks';
import './editor/theme.css';

interface PageData {
  id: string;
  title: string;
  slug: string;
  html: string;
  css: string;
  components: unknown[];
  styles: unknown[];
  status: 'draft' | 'published';
  meta_title?: string;
  meta_description?: string;
}

interface PageBuilderProps {
  pageId: string;
  onBack: () => void;
}

export default function PageBuilder({ pageId, onBack }: PageBuilderProps) {
  const editorRef = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState<PageData | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loading, setLoading] = useState(true);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Load page data ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/pages/${pageId}`);
        const data = await res.json();
        if (data.page) {
          setPage(data.page);
        }
      } catch (e) {
        console.error('Failed to load page:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [pageId]);

  /* ── Save function ── */
  const savePage = useCallback(async (editor: Editor, showStatus = true) => {
    if (!page) return;
    if (showStatus) setSaveStatus('saving');

    try {
      const html = editor.getHtml();
      const css = editor.getCss() || '';
      const components = JSON.parse(JSON.stringify(editor.getComponents()));
      const styles = JSON.parse(JSON.stringify(editor.getStyle()));

      const res = await fetch(`/api/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, css, components, styles }),
      });

      if (res.ok) {
        if (showStatus) {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        }
      } else {
        if (showStatus) setSaveStatus('error');
      }
    } catch {
      if (showStatus) setSaveStatus('error');
    }
  }, [page]);

  /* ── Initialize GrapesJS ── */
  useEffect(() => {
    if (!containerRef.current || !page || editorRef.current) return;

    let editor: Editor;

    (async () => {
      const grapesjs = (await import('grapesjs')).default;
      const gjsPresetWebpage = (await import('grapesjs-preset-webpage')).default;

      const pageData = page;
      const hasComponents = Array.isArray(pageData.components) && pageData.components.length > 0;
      const hasStyles = Array.isArray(pageData.styles) && pageData.styles.length > 0;

      editor = grapesjs.init({
        container: containerRef.current!,
        height: '100%',
        width: 'auto',
        fromElement: false,
        storageManager: false,

        // Load saved content or start fresh
        components: hasComponents
          ? (pageData.components as never)
          : pageData.html || undefined,
        style: hasStyles
          ? (pageData.styles as never)
          : pageData.css || undefined,

        canvas: {
          styles: [],
          scripts: [],
        },

        plugins: [gjsPresetWebpage],
        pluginsOpts: {
          [gjsPresetWebpage as unknown as string]: {
            blocks: [],
            // Disable default blocks, we use our own
            blocksBasicOpts: {
              blocks: ['column1', 'column2', 'column3', 'text', 'link', 'image', 'video', 'map'],
              flexGrid: true,
            },
            formsOpts: false,
            navbarOpts: false,
            countdownOpts: false,
          },
        },

        deviceManager: {
          devices: [
            { name: 'Desktop', width: '' },
            { name: 'Tablet', width: '768px', widthMedia: '992px' },
            { name: 'Mobile', width: '375px', widthMedia: '480px' },
          ],
        },

        panels: {
          defaults: [],
        },

        styleManager: {
          sectors: [
            {
              name: 'Layout',
              open: true,
              properties: [
                { property: 'display', type: 'select', options: [
                  { id: 'block', label: 'Block' },
                  { id: 'flex', label: 'Flex' },
                  { id: 'grid', label: 'Grid' },
                  { id: 'inline-block', label: 'Inline Block' },
                  { id: 'none', label: 'None' },
                ]},
                { property: 'flex-direction' },
                { property: 'justify-content' },
                { property: 'align-items' },
                { property: 'flex-wrap' },
                { property: 'gap' },
              ],
            },
            {
              name: 'Spacing',
              properties: [
                { property: 'padding', type: 'composite', properties: [
                  { property: 'padding-top', type: 'number', units: ['px', '%', 'em', 'rem', 'vh'] },
                  { property: 'padding-right', type: 'number', units: ['px', '%', 'em', 'rem'] },
                  { property: 'padding-bottom', type: 'number', units: ['px', '%', 'em', 'rem', 'vh'] },
                  { property: 'padding-left', type: 'number', units: ['px', '%', 'em', 'rem'] },
                ]},
                { property: 'margin', type: 'composite', properties: [
                  { property: 'margin-top', type: 'number', units: ['px', '%', 'em', 'rem', 'auto' as string] },
                  { property: 'margin-right', type: 'number', units: ['px', '%', 'em', 'rem', 'auto' as string] },
                  { property: 'margin-bottom', type: 'number', units: ['px', '%', 'em', 'rem', 'auto' as string] },
                  { property: 'margin-left', type: 'number', units: ['px', '%', 'em', 'rem', 'auto' as string] },
                ]},
              ],
            },
            {
              name: 'Size',
              properties: [
                { property: 'width', type: 'number', units: ['px', '%', 'vw', 'auto'] },
                { property: 'min-width', type: 'number', units: ['px', '%', 'vw'] },
                { property: 'max-width', type: 'number', units: ['px', '%', 'vw'] },
                { property: 'height', type: 'number', units: ['px', '%', 'vh', 'auto'] },
                { property: 'min-height', type: 'number', units: ['px', '%', 'vh'] },
              ],
            },
            {
              name: 'Typography',
              properties: [
                { property: 'font-family', type: 'select', options: [
                  { id: "'Cormorant Garamond', serif", label: 'Cormorant Garamond' },
                  { id: "'Inter', sans-serif", label: 'Inter' },
                  { id: "'JetBrains Mono', monospace", label: 'JetBrains Mono' },
                  { id: 'Georgia, serif', label: 'Georgia' },
                  { id: 'Arial, sans-serif', label: 'Arial' },
                ]},
                { property: 'font-size', type: 'number', units: ['px', 'em', 'rem', '%'] },
                { property: 'font-weight', type: 'select', options: [
                  { id: '300', label: 'Light' },
                  { id: '400', label: 'Regular' },
                  { id: '500', label: 'Medium' },
                  { id: '600', label: 'Semibold' },
                  { id: '700', label: 'Bold' },
                ]},
                { property: 'line-height', type: 'number', units: ['px', 'em', ''] },
                { property: 'letter-spacing', type: 'number', units: ['px', 'em'] },
                { property: 'color' },
                { property: 'text-align', type: 'radio', options: [
                  { id: 'left', label: 'L' },
                  { id: 'center', label: 'C' },
                  { id: 'right', label: 'R' },
                  { id: 'justify', label: 'J' },
                ]},
                { property: 'text-transform', type: 'select', options: [
                  { id: 'none', label: 'None' },
                  { id: 'uppercase', label: 'Uppercase' },
                  { id: 'lowercase', label: 'Lowercase' },
                  { id: 'capitalize', label: 'Capitalize' },
                ]},
              ],
            },
            {
              name: 'Background',
              properties: [
                { property: 'background-color' },
                { property: 'background-image', type: 'file' },
                { property: 'background-size', type: 'select', options: [
                  { id: 'auto', label: 'Auto' },
                  { id: 'cover', label: 'Cover' },
                  { id: 'contain', label: 'Contain' },
                ]},
                { property: 'background-position', type: 'select', options: [
                  { id: 'center', label: 'Center' },
                  { id: 'top', label: 'Top' },
                  { id: 'bottom', label: 'Bottom' },
                ]},
              ],
            },
            {
              name: 'Borders',
              properties: [
                { property: 'border-radius', type: 'number', units: ['px', '%'] },
                { property: 'border', type: 'composite', properties: [
                  { property: 'border-width', type: 'number', units: ['px'] },
                  { property: 'border-style', type: 'select', options: [
                    { id: 'none', label: 'None' },
                    { id: 'solid', label: 'Solid' },
                    { id: 'dashed', label: 'Dashed' },
                  ]},
                  { property: 'border-color' },
                ]},
                { property: 'box-shadow', type: 'stack', properties: [
                  { property: 'box-shadow-h', type: 'number', units: ['px'], defaults: '0' },
                  { property: 'box-shadow-v', type: 'number', units: ['px'], defaults: '4' },
                  { property: 'box-shadow-blur', type: 'number', units: ['px'], defaults: '20' },
                  { property: 'box-shadow-spread', type: 'number', units: ['px'], defaults: '0' },
                  { property: 'box-shadow-color', defaults: 'rgba(0,0,0,0.3)' },
                ]},
              ],
            },
          ],
        },
      });

      // Inject canvas base styles
      const iframeDoc = editor.Canvas.getDocument();
      if (iframeDoc) {
        const styleEl = iframeDoc.createElement('style');
        styleEl.textContent = CANVAS_STYLES;
        iframeDoc.head.appendChild(styleEl);
      }

      // Also add via config for when canvas reloads
      editor.on('canvas:frame:load', ({ window: frameWindow }: { window: Window }) => {
        const doc = frameWindow.document;
        const existing = doc.getElementById('jr-canvas-styles');
        if (!existing) {
          const s = doc.createElement('style');
          s.id = 'jr-canvas-styles';
          s.textContent = CANVAS_STYLES;
          doc.head.appendChild(s);
        }
      });

      // Register custom blocks
      registerBlocks(editor);

      // Set up panels
      setupPanels(editor);

      // Auto-save on change (debounced 30s)
      editor.on('change:changesCount', () => {
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(() => {
          savePage(editor, false);
        }, 30000);
      });

      // Keyboard shortcut: Ctrl/Cmd+S
      editor.on('run:core:canvas-clear', () => {/* prevent */});

      editorRef.current = editor;
    })();

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (editorRef.current) savePage(editorRef.current);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [savePage]);

  /* ── Publish toggle ── */
  const handlePublish = async () => {
    if (!page) return;
    const newStatus = page.status === 'published' ? 'draft' : 'published';

    // Save content first
    if (editorRef.current) {
      await savePage(editorRef.current);
    }

    const res = await fetch(`/api/pages/${page.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      setPage(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  /* ── Preview ── */
  const handlePreview = () => {
    if (!page) return;
    window.open(`/p/${page.slug}`, '_blank');
  };

  if (loading) {
    return (
      <div className="jr-editor-wrap">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'rgba(236,230,214,0.3)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
          Loading editor...
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="jr-editor-wrap">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'rgba(236,230,214,0.3)', flexDirection: 'column', gap: 16 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>Page not found</span>
          <button onClick={onBack} className="jr-editor-topbar__btn">← Back to Pages</button>
        </div>
      </div>
    );
  }

  return (
    <div className="jr-editor-wrap">
      {/* Top bar */}
      <div className="jr-editor-topbar">
        <div className="jr-editor-topbar__left">
          <button onClick={onBack} className="jr-editor-topbar__back">
            ← Back
          </button>
          <div className="jr-editor-topbar__divider" />
          <span className="jr-editor-topbar__title">{page.title}</span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '3px 8px',
            borderRadius: 3,
            background: page.status === 'published' ? 'rgba(74,222,128,0.1)' : 'rgba(245,158,11,0.1)',
            color: page.status === 'published' ? '#4ade80' : '#f59e0b',
          }}>
            {page.status}
          </span>
        </div>
        <div className="jr-editor-topbar__right">
          {saveStatus !== 'idle' && (
            <span className={`jr-editor-topbar__status jr-editor-topbar__status--${saveStatus === 'saved' ? 'saved' : 'saving'}`}>
              {saveStatus === 'saving' ? '● Saving...' : saveStatus === 'saved' ? '✓ Saved' : '✕ Error'}
            </span>
          )}
          <button onClick={handlePreview} className="jr-editor-topbar__btn">
            Preview
          </button>
          <button
            onClick={() => editorRef.current && savePage(editorRef.current)}
            className="jr-editor-topbar__btn jr-editor-topbar__btn--primary"
          >
            Save
          </button>
          <button
            onClick={handlePublish}
            className={`jr-editor-topbar__btn ${page.status === 'published' ? '' : 'jr-editor-topbar__btn--publish'}`}
          >
            {page.status === 'published' ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Editor container */}
      <div className="jr-editor-body">
        <div ref={containerRef} style={{ height: '100%' }} />
      </div>
    </div>
  );
}

/* ── Panel setup ── */
function setupPanels(editor: Editor) {
  // Views panel (right side tabs)
  editor.Panels.addPanel({
    id: 'panel-right',
    el: '.panel__right',
    resizable: {
      maxDim: 450,
      minDim: 250,
      tc: false, cr: false, bc: false, cl: true,
    },
  });

  // Switcher buttons for right panel
  editor.Panels.addPanel({
    id: 'views',
    buttons: [
      { id: 'open-sm', active: true, label: 'Styles', command: 'open-sm', togglable: false },
      { id: 'open-layers', label: 'Layers', command: 'open-layers', togglable: false },
      { id: 'open-blocks', label: 'Blocks', command: 'open-blocks', togglable: false },
      { id: 'open-traits', label: 'Settings', command: 'open-tm', togglable: false },
    ],
  });

  // Top toolbar: device switcher + actions
  editor.Panels.addPanel({
    id: 'commands',
    buttons: [
      { id: 'device-desktop', label: '🖥', command: 'set-device-desktop', active: true, togglable: false },
      { id: 'device-tablet', label: '📱', command: 'set-device-tablet', togglable: false },
      { id: 'device-mobile', label: '📲', command: 'set-device-mobile', togglable: false },
    ],
  });

  editor.Panels.addPanel({
    id: 'options',
    buttons: [
      { id: 'undo', label: '↩', command: 'core:undo' },
      { id: 'redo', label: '↪', command: 'core:redo' },
      { id: 'clean-all', label: '🗑', command: 'core:canvas-clear' },
      { id: 'preview', label: '👁', command: 'core:preview' },
      { id: 'fullscreen', label: '⛶', command: 'core:fullscreen' },
      { id: 'export', label: '&lt;/&gt;', command: 'export-template' },
    ],
  });

  // Device commands
  editor.Commands.add('set-device-desktop', { run: (e) => e.setDevice('Desktop') });
  editor.Commands.add('set-device-tablet', { run: (e) => e.setDevice('Tablet') });
  editor.Commands.add('set-device-mobile', { run: (e) => e.setDevice('Mobile') });
}
