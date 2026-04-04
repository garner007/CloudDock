import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ArrowRight, Clock, LayoutDashboard, Settings } from 'lucide-react';
import SERVICES from '../services/catalog';
import { isServiceSupported } from '../services/backends';

const RECENT_KEY = 'ls_recent_services';
const MAX_RECENT = 5;

function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function addRecent(id) {
  const prev = getRecent().filter(r => r !== id);
  localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...prev].slice(0, MAX_RECENT)));
}

const STATIC_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', sub: 'Home', emoji: '🏠', group: '' },
  { id: 'settings',  label: 'Settings',  sub: 'Connection & Config', emoji: '⚙️', group: '' },
];

export default function CommandPalette({ open, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // All navigable items — filtered by what the active backend supports
  const backendId = localStorage.getItem('ls_backend') || 'localstack';
  const supportedServices = SERVICES.filter(s => isServiceSupported(s.id, backendId));
  const allItems = [...STATIC_ITEMS, ...supportedServices];

  // Filtered results
  const results = query.trim()
    ? allItems.filter(s =>
        s.label.toLowerCase().includes(query.toLowerCase()) ||
        s.sub?.toLowerCase().includes(query.toLowerCase()) ||
        s.group?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    : (() => {
        const recent = getRecent();
        const recentItems = recent
          .map(id => allItems.find(s => s.id === id))
          .filter(Boolean);
        return recentItems.length
          ? recentItems
          : allItems.slice(0, 8);
      })();

  const showingRecent = !query.trim() && getRecent().length > 0;

  const navigate = useCallback((id) => {
    addRecent(id);
    onNavigate(id);
    onClose();
    setQuery('');
    setSelected(0);
  }, [onNavigate, onClose]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected(s => Math.min(s + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected(s => Math.max(s - 1, 0));
      } else if (e.key === 'Enter' && results[selected]) {
        navigate(results[selected].id);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, selected, navigate, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selected];
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  if (!open) return null;

  return (
    <div
      className="palette-overlay"
      onClick={onClose}
    >
      <div className="palette" onClick={e => e.stopPropagation()} role="dialog" aria-label="Command palette">
        {/* Search input */}
        <div className="palette-input-row">
          <Search size={16} color="var(--aws-text-muted)" />
          <input
            ref={inputRef}
            className="palette-input"
            placeholder="Search services, jump to…"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="palette-esc">esc</kbd>
        </div>

        {/* Section label */}
        <div className="palette-section-label">
          {showingRecent ? (
            <><Clock size={11} /> Recent</>
          ) : query ? (
            `${results.length} result${results.length !== 1 ? 's' : ''}`
          ) : (
            'Services'
          )}
        </div>

        {/* Results */}
        <div className="palette-list" ref={listRef}>
          {results.length === 0 ? (
            <div className="palette-empty">No services match "{query}"</div>
          ) : results.map((item, i) => (
            <button
              key={item.id}
              className={`palette-item ${i === selected ? 'selected' : ''}`}
              onClick={() => navigate(item.id)}
              onMouseEnter={() => setSelected(i)}
            >
              <span className="palette-item-emoji">{item.emoji}</span>
              <div className="palette-item-text">
                <span className="palette-item-label">{item.label}</span>
                {item.sub && <span className="palette-item-sub">{item.sub}</span>}
              </div>
              {item.group && (
                <span className="palette-item-group">{item.group}</span>
              )}
              {item.proOnly && (
                <span className="palette-item-pro">PRO</span>
              )}
              {i === selected && <ArrowRight size={13} color="var(--aws-orange)" />}
            </button>
          ))}
        </div>

        {/* Footer hints */}
        <div className="palette-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>

      <style>{`
        .palette-overlay {
          position: fixed; inset: 0; z-index: 900;
          background: rgba(0,0,0,0.6);
          display: flex; align-items: flex-start; justify-content: center;
          padding-top: 18vh;
          backdrop-filter: blur(3px);
          animation: fadeIn 0.1s ease;
        }
        .palette {
          background: var(--aws-surface-2);
          border: 1px solid var(--aws-border-light);
          border-radius: 12px;
          width: 560px;
          max-width: 90vw;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          animation: paletteIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes paletteIn {
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .palette-input-row {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 16px;
          border-bottom: 1px solid var(--aws-border);
        }
        .palette-input {
          flex: 1; background: none; border: none; outline: none;
          font-size: 16px; color: var(--aws-text); font-family: var(--font-main);
          caret-color: var(--aws-orange);
        }
        .palette-input::placeholder { color: var(--aws-text-muted); }
        .palette-esc {
          padding: 2px 6px; border-radius: 4px;
          background: var(--aws-surface-3); border: 1px solid var(--aws-border);
          color: var(--aws-text-muted); font-size: 11px;
        }
        .palette-section-label {
          display: flex; align-items: center; gap: 5px;
          padding: 8px 16px 4px;
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.7px; color: var(--aws-text-muted);
        }
        .palette-list {
          max-height: 340px; overflow-y: auto;
          padding: 4px 8px 8px;
        }
        .palette-empty {
          padding: 20px; text-align: center;
          font-size: 13px; color: var(--aws-text-muted);
        }
        .palette-item {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 9px 10px; border: none;
          background: none; cursor: pointer; border-radius: 7px;
          text-align: left; transition: background 0.08s;
          font-family: var(--font-main);
        }
        .palette-item.selected { background: var(--aws-surface-3); }
        .palette-item:hover { background: var(--aws-surface-3); }
        .palette-item-emoji { font-size: 18px; width: 26px; text-align: center; flex-shrink: 0; }
        .palette-item-text { display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0; }
        .palette-item-label { font-size: 14px; font-weight: 500; color: var(--aws-text); }
        .palette-item-sub { font-size: 11px; color: var(--aws-text-muted); }
        .palette-item-group {
          font-size: 10px; color: var(--aws-text-muted);
          background: var(--aws-surface); border: 1px solid var(--aws-border);
          padding: 2px 6px; border-radius: 4px; white-space: nowrap;
        }
        .palette-item-pro {
          font-size: 8px; font-weight: 700; padding: 1px 4px; border-radius: 3px;
          background: rgba(255,153,0,0.15); color: var(--aws-orange);
          border: 1px solid rgba(255,153,0,0.3);
        }
        .palette-footer {
          display: flex; gap: 16px; align-items: center;
          padding: 8px 16px;
          border-top: 1px solid var(--aws-border);
          background: var(--aws-surface-3);
          font-size: 11px; color: var(--aws-text-muted);
        }
        .palette-footer kbd {
          padding: 1px 5px; border-radius: 3px;
          background: var(--aws-surface-2); border: 1px solid var(--aws-border);
          font-family: var(--font-mono); font-size: 10px;
          color: var(--aws-text-dim); margin-right: 3px;
        }
      `}</style>
    </div>
  );
}
