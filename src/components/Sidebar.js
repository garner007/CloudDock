import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Settings, ChevronDown } from 'lucide-react';
import SERVICES, { GROUPS } from '../services/catalog';
import { isServiceSupported } from '../services/backends';
import './Sidebar.css';

const STORAGE_KEY = 'ls_sidebar_expanded';

function loadExpanded(currentService) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  // Default: expand the group of the current service, collapse rest
  const activeSvc = SERVICES.find(s => s.id === currentService);
  return Object.fromEntries(GROUPS.map(g => [g, g === activeSvc?.group]));
}

function saveExpanded(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export default function Sidebar({ currentService, onNavigate, collapsed, onToggle }) {
  const [expanded, setExpanded] = useState(() => loadExpanded(currentService));
  const backendId = localStorage.getItem('ls_backend') || 'localstack';

  // Auto-expand the group of the newly active service
  useEffect(() => {
    const activeSvc = SERVICES.find(s => s.id === currentService);
    if (!activeSvc?.group) return;
    setExpanded(prev => {
      if (prev[activeSvc.group]) return prev; // already open
      const next = { ...prev, [activeSvc.group]: true };
      saveExpanded(next);
      return next;
    });
  }, [currentService]);

  const toggleGroup = useCallback((group, e) => {
    e.stopPropagation();
    setExpanded(prev => {
      const next = { ...prev, [group]: !prev[group] };
      saveExpanded(next);
      return next;
    });
  }, []);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <nav className="sidebar-nav">
        {/* Dashboard */}
        <button
          className={`sidebar-item ${currentService === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavigate('dashboard')}
          title={collapsed ? 'Dashboard' : undefined}
        >
          <div className="sidebar-item-icon">
            <LayoutDashboard size={15} />
          </div>
          {!collapsed && <span className="sidebar-item-label">Dashboard</span>}
          {currentService === 'dashboard' && <div className="sidebar-active-bar" />}
        </button>

        {/* Service groups */}
        {GROUPS.map(group => {
          const groupServices = SERVICES.filter(s => s.group === group && isServiceSupported(s.id, backendId));
          if (!groupServices.length) return null;
          const isOpen = expanded[group];
          const hasActive = groupServices.some(s => s.id === currentService);

          return (
            <div key={group} className="sidebar-group">
              {/* Group header */}
              {collapsed ? (
                <div className="sidebar-divider-line" />
              ) : (
                <button
                  className={`sidebar-group-header ${hasActive ? 'has-active' : ''}`}
                  onClick={(e) => toggleGroup(group, e)}
                >
                  <span className="sidebar-group-label">{group}</span>
                  <span className={`sidebar-group-chevron ${isOpen ? 'open' : ''}`}>
                    <ChevronDown size={12} />
                  </span>
                </button>
              )}

              {/* Group items — collapsible. The inner <div> is required so
                  grid-template-rows: 0fr→1fr has a single child to constrain. */}
              <div className={`sidebar-group-items ${isOpen || collapsed ? 'open' : ''}`}>
                <div className="sidebar-group-inner">
                  {groupServices.map(svc => {
                    const active = currentService === svc.id;
                    return (
                      <button
                        key={svc.id}
                        className={`sidebar-item ${active ? 'active' : ''}`}
                        onClick={() => onNavigate(svc.id)}
                        title={collapsed ? `${svc.label}${svc.proOnly ? ' (Pro)' : ''}` : undefined}
                      >
                        <div className="sidebar-item-emoji">{svc.emoji}</div>
                        {!collapsed && (
                          <div className="sidebar-item-text">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span className="sidebar-item-label">{svc.label}</span>
                              {svc.proOnly && (
                                <span className="sidebar-pro-badge">PRO</span>
                              )}
                            </div>
                            {svc.sub && <span className="sidebar-item-sub">{svc.sub}</span>}
                          </div>
                        )}
                        {active && <div className="sidebar-active-bar" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Settings */}
        <div className="sidebar-divider-line" style={{ margin: '6px 10px' }} />
        <button
          className={`sidebar-item ${currentService === 'settings' ? 'active' : ''}`}
          onClick={() => onNavigate('settings')}
          title={collapsed ? 'Settings' : undefined}
        >
          <div className="sidebar-item-icon"><Settings size={15} /></div>
          {!collapsed && (
            <div className="sidebar-item-text">
              <span className="sidebar-item-label">Settings</span>
              <span className="sidebar-item-sub">Connection & Config</span>
            </div>
          )}
          {currentService === 'settings' && <div className="sidebar-active-bar" />}
        </button>
      </nav>

      <button className="sidebar-toggle" onClick={onToggle} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        <span className={`sidebar-toggle-icon ${collapsed ? 'flipped' : ''}`}>‹</span>
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}
