'use client';

import { useState, useEffect, useCallback } from 'react';
import RichTextEditor from '../RichTextEditor';
import { btnPrimary, btnSecondary, labelStyle } from '../Modal';
import {
  fetchAllContent,
  updateContent,
  resetContent,
  groupBySection,
  SECTION_LABELS,
  DEFAULT_CONTENT,
  type ContentBlock,
} from '@/lib/content';

export default function ContentEditor() {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const loadContent = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllContent();
    setBlocks(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const grouped = groupBySection(blocks);
  const sections = Object.keys(SECTION_LABELS);

  const handleChange = (blockId: string, newContent: string) => {
    setBlocks(prev =>
      prev.map(b => (b.id === blockId ? { ...b, content: newContent } : b)),
    );
    setSaved(prev => ({ ...prev, [blockId]: false }));
  };

  const handleSave = async (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    setSaving(prev => ({ ...prev, [blockId]: true }));
    try {
      await updateContent(blockId, block.content, 'admin');
      setSaved(prev => ({ ...prev, [blockId]: true }));
      setTimeout(() => setSaved(prev => ({ ...prev, [blockId]: false })), 2000);
    } finally {
      setSaving(prev => ({ ...prev, [blockId]: false }));
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all content to defaults? This cannot be undone.')) return;
    await resetContent();
    setBlocks(DEFAULT_CONTENT);
    setSaved({});
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--admin-text-dim)' }}>
        Loading content...
      </div>
    );
  }

  return (
    <div>
      {/* Section tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 32,
        borderBottom: '1px solid var(--admin-divider)',
        paddingBottom: 0,
      }}>
        {sections.map(section => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            style={{
              padding: '10px 20px',
              background: activeSection === section ? 'rgba(201,169,110,0.08)' : 'transparent',
              border: 'none',
              borderBottom: activeSection === section ? '2px solid #c9a96e' : '2px solid transparent',
              color: activeSection === section ? 'var(--admin-blue)' : 'var(--admin-text-muted)',
              cursor: 'pointer',
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: 1.5,
              textTransform: 'uppercase' as const,
              transition: 'all 0.2s ease',
            }}
          >
            {SECTION_LABELS[section]}
          </button>
        ))}
      </div>

      {/* Content blocks for active section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {(grouped[activeSection] || []).map(block => (
          <div key={block.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>{block.label}</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {saved[block.id] && (
                  <span style={{ fontSize: 11, color: '#22c55e', fontFamily: "'JetBrains Mono', monospace" }}>
                    ✓ Saved
                  </span>
                )}
                <button
                  onClick={() => handleSave(block.id)}
                  disabled={saving[block.id]}
                  style={{
                    ...btnPrimary,
                    padding: '6px 16px',
                    fontSize: 10,
                    opacity: saving[block.id] ? 0.5 : 1,
                  }}
                >
                  {saving[block.id] ? 'SAVING...' : 'SAVE'}
                </button>
              </div>
            </div>
            <RichTextEditor
              value={block.content}
              onChange={(val) => handleChange(block.id, val)}
              contentType={block.content_type === 'html' ? 'html' : 'text'}
              minHeight={block.content_type === 'text' && block.content.length < 100 ? 60 : 140}
            />
            {block.updated_at && (
              <div style={{
                fontSize: 10,
                color: 'var(--admin-text-dim)',
                fontFamily: "'JetBrains Mono', monospace",
                marginTop: 6,
              }}>
                Last updated: {new Date(block.updated_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
                {block.updated_by && ` by ${block.updated_by}`}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reset button */}
      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--admin-divider)' }}>
        <button onClick={handleReset} style={{ ...btnSecondary, fontSize: 10, padding: '8px 16px' }}>
          RESET ALL CONTENT TO DEFAULTS
        </button>
      </div>
    </div>
  );
}
