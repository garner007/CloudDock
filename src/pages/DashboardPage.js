import React, { useState, useCallback } from 'react';
import { LayoutDashboard, Activity, Wifi, WifiOff, ArrowRight,
         ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import SERVICES, { GROUPS } from '../services/catalog';
import { BACKENDS, isServiceSupported } from '../services/backends';

// Persist expanded state across navigation
const STORAGE_KEY = 'ls_dash_expanded';

function loadExpanded() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  // Default: first two groups open
  return Object.fromEntries(GROUPS.map((g, i) => [g, i < 2]));
}

function saveExpanded(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export default function DashboardPage({ health, onNavigate }) {
  const connected = health?.status === 'connected';
  const services  = health?.services || {};
  const edition   = health?.edition;
  const backendId = health?.backend || localStorage.getItem('ls_backend') || 'localstack';
  const backend   = BACKENDS[backendId] || BACKENDS.localstack;

  // Filter catalog to only services this backend supports
  const visibleServices = SERVICES.filter(s => isServiceSupported(s.id, backendId));

  const [expanded, setExpanded] = useState(loadExpanded);

  const toggle = useCallback((group) => {
    setExpanded(prev => {
      const next = { ...prev, [group]: !prev[group] };
      saveExpanded(next);
      return next;
    });
  }, []);

  const expandAll = () => {
    const all = Object.fromEntries(GROUPS.map(g => [g, true]));
    setExpanded(all); saveExpanded(all);
  };
  const collapseAll = () => {
    const none = Object.fromEntries(GROUPS.map(g => [g, false]));
    setExpanded(none); saveExpanded(none);
  };

  const allExpanded = GROUPS.every(g => expanded[g]);
  const allCollapsed = GROUPS.every(g => !expanded[g]);

  const getStatus = (healthKey) => {
    if (!healthKey) return 'unknown';
    const val = services[healthKey];
    if (!val) return 'unknown';
    if (val === 'running' || val === 'available') return 'running';
    if (val === 'error') return 'error';
    return val;
  };

  const totalServices = visibleServices.length;
  const runningCount = connected
    ? visibleServices.filter(s => getStatus(s.healthKey) === 'running').length : 0;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><LayoutDashboard size={20} /> Dashboard</div>
          <div className="page-subtitle">
            {totalServices} services · {connected ? `${runningCount} running` : 'offline'}
          </div>
        </div>
      </div>

      {/* Connection banner */}
      <div className={`conn-banner ${connected ? 'conn-ok' : 'conn-err'}`}>
        <div className="conn-banner-left">
          {connected ? <Wifi size={18} /> : <WifiOff size={18} />}
          <div>
            <div className="conn-banner-title">
              {connected
                ? `Connected to ${backend.logo} ${backend.name}`
                : 'Not Connected'}
            </div>
            <div className="conn-banner-sub">
              {connected
                ? `${health?.endpoint}${health?.version ? ` · v${health.version}` : ''} · ${totalServices} services`
                : `Cannot reach ${health?.endpoint || 'http://localhost:4566'} — is your emulator running?`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {connected && edition && (
            <div className={`edition-badge ${edition === 'pro' ? 'edition-pro' : 'edition-community'}`}>
              {edition === 'pro' ? '⭐ Pro' : `${backend.logo} ${backend.name}`}
            </div>
          )}
          {!connected && (
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('settings')}>
              Configure <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Controls row */}
      <div className="dash-controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--aws-text-muted)' }}>
          <Activity size={13} />
          <span>
            {connected
              ? `${runningCount} of ${totalServices} services running`
              : `${totalServices} services — connect LocalStack to see status`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={allExpanded ? collapseAll : expandAll}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <ChevronsUpDown size={12} />
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="dash-legend">
        {[
          { color: 'var(--aws-green)', label: 'Running' },
          { color: 'var(--aws-text-muted)', label: 'Unknown' },
          { color: 'var(--aws-red)', label: 'Error / Offline' },
        ].map(({ color, label }) => (
          <span key={label} className="legend-item">
            <span className="legend-dot" style={{ background: color }} />
            {label}
          </span>
        ))}
        <span className="legend-item">
          <span className="pro-badge-tiny">PRO</span>
          Paid plan only
        </span>
      </div>

      {/* Collapsible service groups */}
      {GROUPS.map(group => {
        const groupServices = visibleServices.filter(s => s.group === group);
        if (!groupServices.length) return null;

        const isOpen = expanded[group];
        const runningInGroup = connected
          ? groupServices.filter(s => getStatus(s.healthKey) === 'running').length : 0;
        const proCount = groupServices.filter(s => s.proOnly).length;

        return (
          <div key={group} className="group-section">
            {/* Clickable header */}
            <button className="group-header" onClick={() => toggle(group)}>
              <div className="group-header-left">
                <span className={`group-chevron ${isOpen ? 'open' : ''}`}>
                  <ChevronDown size={15} />
                </span>
                <span className="group-label">{group}</span>
                <span className="group-count">{groupServices.length} services</span>
                {proCount > 0 && (
                  <span className="group-pro-count">{proCount} pro</span>
                )}
              </div>
              <div className="group-header-right">
                {connected && (
                  <span className="group-running">
                    <span className="running-dot" />
                    {runningInGroup} running
                  </span>
                )}
              </div>
            </button>

            {/* Collapsible content */}
            <div className={`group-body ${isOpen ? 'open' : ''}`}>
              <div className="service-grid">
                {groupServices.map(svc => {
                  const status = connected ? getStatus(svc.healthKey) : 'offline';
                  const dotColor = {
                    running: 'var(--aws-green)',
                    error: 'var(--aws-red)',
                    offline: 'var(--aws-red)',
                  }[status] || 'var(--aws-text-muted)';

                  return (
                    <div key={svc.id} className="service-card" onClick={() => onNavigate(svc.id)}>
                      <div className="service-card-top">
                        <span className="service-emoji">{svc.emoji}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          {svc.proOnly && (
                            <span className="pro-badge-tiny">PRO</span>
                          )}
                          <div
                            className={`status-dot ${status === 'running' ? 'dot-running' : ''}`}
                            style={{ background: dotColor }}
                            title={status}
                          />
                        </div>
                      </div>
                      <div className="service-card-name">{svc.label}</div>
                      <div className="service-card-sub">{svc.sub}</div>
                      <div className="service-card-action">
                        Open <ArrowRight size={11} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      <style>{`
        /* Connection banner */
        .conn-banner {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px; border-radius: 8px; margin-bottom: 16px; border: 1px solid;
        }
        .conn-ok { background: rgba(29,185,84,0.08); border-color: rgba(29,185,84,0.25); color: var(--aws-green); }
        .conn-err { background: rgba(229,62,62,0.08); border-color: rgba(229,62,62,0.25); color: var(--aws-red); }
        .conn-banner-left { display: flex; align-items: center; gap: 12px; }
        .conn-banner-title { font-weight: 600; font-size: 14px; }
        .conn-banner-sub { font-size: 11px; opacity: 0.75; margin-top: 2px; font-family: var(--font-mono); }

        .edition-badge {
          display: flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
        }
        .edition-pro {
          background: rgba(255,153,0,0.12); color: var(--aws-orange);
          border: 1px solid rgba(255,153,0,0.3);
        }
        .edition-community {
          background: rgba(139,158,176,0.12); color: var(--aws-text-muted);
          border: 1px solid rgba(139,158,176,0.2);
        }

        /* Controls row */
        .dash-controls {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 10px;
        }

        /* Legend */
        .dash-legend {
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 16px; padding: 8px 0;
          border-bottom: 1px solid var(--aws-border);
        }
        .legend-item {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; color: var(--aws-text-muted);
        }
        .legend-dot {
          width: 7px; height: 7px; border-radius: 50%; display: inline-block;
        }
        .pro-badge-tiny {
          font-size: 8px; font-weight: 700; padding: 1px 4px; border-radius: 3px;
          background: rgba(255,153,0,0.15); color: var(--aws-orange);
          border: 1px solid rgba(255,153,0,0.25); letter-spacing: 0.5px; line-height: 1.5;
        }

        /* Group section */
        .group-section {
          margin-bottom: 6px;
          border: 1px solid var(--aws-border);
          border-radius: 8px;
          overflow: hidden;
          background: var(--aws-surface-2);
        }

        .group-header {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px;
          background: var(--aws-surface-3);
          border: none; cursor: pointer;
          transition: background 0.15s;
          border-bottom: 1px solid transparent;
        }
        .group-header:hover { background: var(--aws-border); }
        .group-section:has(.group-body.open) .group-header {
          border-bottom-color: var(--aws-border);
        }

        .group-header-left { display: flex; align-items: center; gap: 10px; }
        .group-header-right { display: flex; align-items: center; gap: 8px; }

        .group-chevron {
          color: var(--aws-text-muted);
          transition: transform 0.2s ease;
          display: flex; align-items: center;
        }
        .group-chevron.open { transform: rotate(180deg); }

        .group-label {
          font-size: 12px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.7px; color: var(--aws-text);
        }
        .group-count {
          font-size: 11px; color: var(--aws-text-muted);
          background: var(--aws-surface); padding: 2px 7px; border-radius: 10px;
          border: 1px solid var(--aws-border);
        }
        .group-pro-count {
          font-size: 10px; color: var(--aws-orange);
          background: rgba(255,153,0,0.1); padding: 2px 6px; border-radius: 10px;
          border: 1px solid rgba(255,153,0,0.25);
        }
        .group-running {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; color: var(--aws-text-muted);
        }
        .running-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--aws-green);
        }

        /* Collapsible body with smooth animation */
        .group-body {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.22s ease;
        }
        .group-body.open {
          grid-template-rows: 1fr;
        }
        .group-body > .service-grid {
          overflow: hidden;
          padding: 0;
        }
        .group-body.open > .service-grid {
          padding: 14px;
        }

        /* Service grid */
        .service-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 8px;
        }

        /* Service card */
        .service-card {
          background: var(--aws-surface-3); border: 1px solid var(--aws-border);
          border-radius: 8px; padding: 12px; cursor: pointer;
          transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
        }
        .service-card:hover {
          border-color: var(--aws-orange);
          transform: translateY(-1px);
          box-shadow: 0 3px 12px rgba(0,0,0,0.2);
        }
        .service-card-top {
          display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px;
        }
        .service-emoji { font-size: 20px; }
        .status-dot {
          width: 7px; height: 7px; border-radius: 50%; margin-top: 4px;
        }
        .dot-running {
          box-shadow: 0 0 4px rgba(29,185,84,0.6);
        }
        .service-card-name {
          font-size: 12px; font-weight: 600; color: var(--aws-text); margin-bottom: 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .service-card-sub {
          font-size: 10px; color: var(--aws-text-muted); margin-bottom: 8px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .service-card-action {
          display: flex; align-items: center; gap: 4px;
          font-size: 10px; color: var(--aws-text-muted);
          opacity: 0; transition: opacity 0.15s;
        }
        .service-card:hover .service-card-action {
          opacity: 1; color: var(--aws-orange);
        }
      `}</style>
    </div>
  );
}
