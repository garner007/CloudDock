import React, { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * CopyButton - small inline copy icon that briefly shows a checkmark on success.
 *
 * Usage:
 *   <CopyButton value={resource.Arn} />
 *   <CopyButton value="arn:aws:..." label="Copy ARN" size={12} />
 */
export default function CopyButton({ value, label, size = 12, style = {} }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e) => {
    e.stopPropagation();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Fallback for environments without clipboard API
      const el = document.createElement('textarea');
      el.value = String(value);
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }, [value]);

  return (
    <button
      onClick={handleCopy}
      title={label || `Copy: ${value}`}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
        borderRadius: 3, display: 'inline-flex', alignItems: 'center',
        color: copied ? 'var(--aws-green)' : 'var(--aws-text-muted)',
        opacity: copied ? 1 : 0.6,
        transition: 'opacity 0.12s, color 0.12s',
        verticalAlign: 'middle',
        ...style,
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
      onMouseLeave={e => { if (!copied) e.currentTarget.style.opacity = '0.6'; }}
    >
      {copied
        ? <Check size={size} />
        : <Copy size={size} />
      }
    </button>
  );
}

/**
 * CopyableText - renders text with an inline copy button next to it.
 * Great for ARNs, IDs, endpoints.
 *
 * <CopyableText value={bucket.Arn} mono truncate />
 */
export function CopyableText({ value, mono, truncate, maxWidth = 260, className = '' }) {
  if (!value) return <span style={{ color: 'var(--aws-text-muted)' }}>—</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, maxWidth }}>
      <span
        className={className}
        style={{
          fontFamily: mono ? 'var(--font-mono)' : undefined,
          fontSize: mono ? '11px' : undefined,
          color: mono ? 'var(--aws-cyan)' : undefined,
          overflow: truncate ? 'hidden' : undefined,
          textOverflow: truncate ? 'ellipsis' : undefined,
          whiteSpace: truncate ? 'nowrap' : undefined,
          minWidth: 0,
        }}
        title={value}
      >
        {value}
      </span>
      <CopyButton value={value} size={11} />
    </span>
  );
}
