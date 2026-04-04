import React, { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Copy } from 'lucide-react';

export default function SecretValue({ value, onCopy }) {
  const [revealed, setRevealed] = useState(false);

  // Auto-hide after 10 seconds
  useEffect(() => {
    if (!revealed) return;
    const timer = setTimeout(() => setRevealed(false), 10000);
    return () => clearTimeout(timer);
  }, [revealed]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    if (onCopy) onCopy();
  }, [value, onCopy]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="mono" style={{ fontSize: 12, color: 'var(--aws-text)', wordBreak: 'break-all' }}>
        {revealed ? value : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
      </span>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => setRevealed(r => !r)}
        title={revealed ? 'Hide value' : 'Reveal value'}
        aria-label={revealed ? 'Hide secret value' : 'Reveal secret value'}
      >
        {revealed ? <EyeOff size={11} /> : <Eye size={11} />}
      </button>
      {value && (
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleCopy}
          title="Copy to clipboard"
          aria-label="Copy secret value"
        >
          <Copy size={11} />
        </button>
      )}
    </div>
  );
}
