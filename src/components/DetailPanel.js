import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * DetailPanel — slide-over panel from the right side.
 *
 * Props:
 *   title    {string}     Panel heading
 *   onClose  {fn}         Called to close the panel
 *   children {ReactNode}  Panel content
 *   width    {string}     Optional CSS width override
 */
export default function DetailPanel({ title, onClose, children, width }) {
  // Escape key closes
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="detail-panel-overlay">
      <div
        className="detail-panel-backdrop"
        data-testid="detail-panel-backdrop"
        onClick={onClose}
      />
      <div
        className="detail-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={width ? { width } : undefined}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid var(--aws-border)' }}>
          <span className="modal-title">{title}</span>
          <button className="close-btn" onClick={onClose} aria-label="Close panel">
            <X size={16} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '22px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * KVGrid — key/value detail grid using existing .kv-grid CSS.
 *
 * Props:
 *   items {Array} [{ label, value }]
 */
export function KVGrid({ items }) {
  return (
    <div className="kv-grid">
      {items.map(({ label, value }) => (
        <React.Fragment key={label}>
          <div className="kv-label">{label}</div>
          <div className="kv-value">{value}</div>
        </React.Fragment>
      ))}
    </div>
  );
}
