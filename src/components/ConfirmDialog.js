import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * ConfirmDialog — replaces window.confirm for destructive operations.
 *
 * Props:
 *   open        {bool}   Whether the dialog is visible
 *   title       {string} Short headline, e.g. "Delete bucket?"
 *   message     {string} Explanatory body text
 *   confirmLabel{string} Label for the confirm button (default "Delete")
 *   danger      {bool}   If true, confirm button is red (default true)
 *   onConfirm   {fn}     Called when the user confirms
 *   onCancel    {fn}     Called when the user cancels or presses Escape
 *
 * Usage:
 *   const [confirm, setConfirm] = useState(null);
 *
 *   <ConfirmDialog
 *     open={!!confirm}
 *     title={confirm?.title}
 *     message={confirm?.message}
 *     onConfirm={() => { confirm?.action(); setConfirm(null); }}
 *     onCancel={() => setConfirm(null)}
 *   />
 *
 *   // Trigger:
 *   setConfirm({ title: 'Delete bucket "foo"?', message: 'This action cannot be undone.', action: () => deleteBucket('foo') });
 */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  danger = true,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);

  // Focus the confirm button on open so Enter/Space activates it
  useEffect(() => {
    if (open) setTimeout(() => confirmRef.current?.focus(), 50);
  }, [open]);

  // Escape key cancels
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      style={{ zIndex: 500 }}
    >
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 420 }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={message ? 'confirm-message' : undefined}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--aws-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: danger ? 'rgba(229,62,62,0.12)' : 'rgba(255,153,0,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {danger
                ? <Trash2 size={15} color="var(--aws-red)" />
                : <AlertTriangle size={15} color="var(--aws-orange)" />
              }
            </div>
            <span id="confirm-title" className="modal-title">{title}</span>
          </div>
          <button className="close-btn" onClick={onCancel} aria-label="Cancel">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {message && (
          <div className="modal-body">
            <p id="confirm-message" style={{
              fontSize: 13, color: 'var(--aws-text-muted)', lineHeight: 1.6, margin: 0,
            }}>
              {message}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            ref={confirmRef}
            className={danger ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * useConfirm — hook that provides a simple imperative API for triggering confirmations.
 *
 * Usage:
 *   const { confirmDialog, requestConfirm } = useConfirm();
 *
 *   // In JSX: {confirmDialog}
 *
 *   // To trigger:
 *   requestConfirm({
 *     title: 'Delete bucket "my-bucket"?',
 *     message: 'All objects inside will also be deleted. This cannot be undone.',
 *     confirmLabel: 'Delete',
 *     onConfirm: () => deleteBucket('my-bucket'),
 *   });
 */
export function useConfirm() {
  const [state, setState] = React.useState(null);

  const requestConfirm = React.useCallback((opts) => {
    setState(opts);
  }, []);

  const handleConfirm = React.useCallback(() => {
    state?.onConfirm?.();
    setState(null);
  }, [state]);

  const handleCancel = React.useCallback(() => {
    state?.onCancel?.();
    setState(null);
  }, [state]);

  const confirmDialog = (
    <ConfirmDialog
      open={!!state}
      title={state?.title}
      message={state?.message}
      confirmLabel={state?.confirmLabel}
      danger={state?.danger !== false}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirmDialog, requestConfirm };
}
