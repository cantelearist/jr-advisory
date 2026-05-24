'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  contentType?: 'text' | 'html';
  placeholder?: string;
  minHeight?: number;
}

const TOOLBAR_BUTTONS = [
  { command: 'bold', icon: 'B', label: 'Bold', style: { fontWeight: 700 } },
  { command: 'italic', icon: 'I', label: 'Italic', style: { fontStyle: 'italic' } },
  { command: 'underline', icon: 'U', label: 'Underline', style: { textDecoration: 'underline' } },
  { command: 'strikeThrough', icon: 'S', label: 'Strikethrough', style: { textDecoration: 'line-through' } },
] as const;

const BLOCK_OPTIONS = [
  { value: 'p', label: 'Paragraph' },
  { value: 'h2', label: 'Heading 2' },
  { value: 'h3', label: 'Heading 3' },
  { value: 'h4', label: 'Heading 4' },
  { value: 'blockquote', label: 'Quote' },
] as const;

export default function RichTextEditor({
  value,
  onChange,
  contentType = 'html',
  placeholder = 'Start typing...',
  minHeight = 200,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSource, setIsSource] = useState(false);
  const [sourceValue, setSourceValue] = useState(value);
  const isInitialized = useRef(false);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      if (contentType === 'text') {
        editorRef.current.innerText = value;
      } else {
        editorRef.current.innerHTML = value || '';
      }
      isInitialized.current = true;
    }
  }, [value, contentType]);

  // Sync external value changes
  useEffect(() => {
    if (editorRef.current && isInitialized.current) {
      const current = contentType === 'text'
        ? editorRef.current.innerText
        : editorRef.current.innerHTML;
      if (current !== value) {
        if (contentType === 'text') {
          editorRef.current.innerText = value;
        } else {
          editorRef.current.innerHTML = value || '';
        }
      }
    }
    setSourceValue(value);
  }, [value, contentType]);

  const execCommand = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    handleInput();
  }, []);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const newValue = contentType === 'text'
      ? editorRef.current.innerText
      : editorRef.current.innerHTML;
    onChange(newValue);
  }, [onChange, contentType]);

  const handleBlockFormat = useCallback((tag: string) => {
    if (tag === 'p') {
      document.execCommand('formatBlock', false, '<p>');
    } else if (tag === 'blockquote') {
      document.execCommand('formatBlock', false, '<blockquote>');
    } else {
      document.execCommand('formatBlock', false, `<${tag}>`);
    }
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const toggleSource = () => {
    if (isSource) {
      // Switching from source to visual
      if (editorRef.current) {
        if (contentType === 'text') {
          editorRef.current.innerText = sourceValue;
        } else {
          editorRef.current.innerHTML = sourceValue;
        }
      }
      onChange(sourceValue);
    } else {
      // Switching to source view
      setSourceValue(value);
    }
    setIsSource(!isSource);
  };

  if (contentType === 'text') {
    return (
      <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden' }}>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            minHeight,
            padding: '16px',
            background: 'rgba(0,0,0,0.3)',
            border: 'none',
            color: 'rgba(255,255,255,0.85)',
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            lineHeight: 1.7,
            resize: 'vertical',
            outline: 'none',
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexWrap: 'wrap',
      }}>
        {/* Block format selector */}
        <select
          onChange={e => handleBlockFormat(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 11,
            marginRight: 8,
            cursor: 'pointer',
          }}
          defaultValue="p"
        >
          {BLOCK_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value} style={{ background: '#1a1b1e' }}>
              {opt.label}
            </option>
          ))}
        </select>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', margin: '0 6px' }} />

        {/* Inline formatting */}
        {TOOLBAR_BUTTONS.map(btn => (
          <button
            key={btn.command}
            onClick={() => execCommand(btn.command)}
            title={btn.label}
            style={{
              background: 'transparent',
              border: '1px solid transparent',
              color: 'rgba(255,255,255,0.5)',
              padding: '4px 8px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.15s ease',
              ...btn.style,
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.background = 'rgba(201,169,110,0.1)';
              (e.target as HTMLElement).style.borderColor = 'rgba(201,169,110,0.2)';
              (e.target as HTMLElement).style.color = '#c9a96e';
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.background = 'transparent';
              (e.target as HTMLElement).style.borderColor = 'transparent';
              (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.5)';
            }}
          >
            {btn.icon}
          </button>
        ))}

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)', margin: '0 6px' }} />

        {/* List buttons */}
        <button
          onClick={() => execCommand('insertUnorderedList')}
          title="Bullet list"
          style={{
            background: 'transparent', border: '1px solid transparent',
            color: 'rgba(255,255,255,0.5)', padding: '4px 8px', borderRadius: 4,
            cursor: 'pointer', fontSize: 13,
          }}
        >
          •≡
        </button>
        <button
          onClick={() => execCommand('insertOrderedList')}
          title="Numbered list"
          style={{
            background: 'transparent', border: '1px solid transparent',
            color: 'rgba(255,255,255,0.5)', padding: '4px 8px', borderRadius: 4,
            cursor: 'pointer', fontSize: 13,
          }}
        >
          1≡
        </button>

        <div style={{ flex: 1 }} />

        {/* Source toggle */}
        <button
          onClick={toggleSource}
          style={{
            background: isSource ? 'rgba(201,169,110,0.12)' : 'transparent',
            border: `1px solid ${isSource ? 'rgba(201,169,110,0.3)' : 'transparent'}`,
            color: isSource ? '#c9a96e' : 'rgba(255,255,255,0.35)',
            padding: '4px 10px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: 1,
          }}
        >
          {'</>'}
        </button>
      </div>

      {/* Editor area */}
      {isSource ? (
        <textarea
          value={sourceValue}
          onChange={e => setSourceValue(e.target.value)}
          style={{
            width: '100%',
            minHeight,
            padding: '16px',
            background: 'rgba(0,0,0,0.4)',
            border: 'none',
            color: '#c9a96e',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
          }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          data-placeholder={placeholder}
          style={{
            minHeight,
            padding: '16px',
            background: 'rgba(0,0,0,0.3)',
            color: 'rgba(255,255,255,0.85)',
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            lineHeight: 1.7,
            outline: 'none',
            cursor: 'text',
          }}
        />
      )}
    </div>
  );
}
