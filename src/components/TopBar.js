import React, { useState } from 'react';
import { Search, RefreshCw, Wifi, WifiOff, Settings, ChevronDown, Sun, Moon, Monitor } from 'lucide-react';
import SERVICES, { GROUPS } from '../services/catalog';
import { BACKENDS, isServiceSupported } from '../services/backends';
import './TopBar.css';

const THEME_OPTIONS = [
  { value: 'dark',   label: 'Dark',   icon: Moon },
  { value: 'light',  label: 'Light',  icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
];

export default function TopBar({
  health, checkingHealth, onRefreshHealth, onNavigate, currentService,
  onOpenPalette, themePref, themeResolved, setTheme,
}) {
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [showTheme, setShowTheme] = useState(false);

  const endpoint = localStorage.getItem('ls_endpoint') || 'http://localhost:4566';
  const region   = localStorage.getItem('ls_region')   || 'us-east-1';
  const backendId = localStorage.getItem('ls_backend') || (health?.backend) || 'localstack';
  const visibleServices = SERVICES.filter(s => isServiceSupported(s.id, backendId));

  const filtered = visibleServices.filter(s =>
    s.label.toLowerCase().includes(search.toLowerCase()) ||
    s.sub?.toLowerCase().includes(search.toLowerCase())
  );

  const connected = health?.status === 'connected';
  const CurrentThemeIcon = THEME_OPTIONS.find(t => t.value === themePref)?.icon || Moon;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-logo" onClick={() => onNavigate('dashboard')}>
          <div className="logo-mark">LS</div>
          <div className="logo-text">
            <span className="logo-main">LocalStack</span>
            <span className="logo-sub">Desktop</span>
          </div>
        </div>
        <div className="topbar-divider" />
        <div className="services-menu">
          <button className={`services-btn ${showServices ? 'active' : ''}`} onClick={() => setShowServices(v => !v)}>
            Services <ChevronDown size={13} />
          </button>
          {showServices && (
            <div className="services-dropdown-mega" onMouseLeave={() => setShowServices(false)}>
              {GROUPS.map(group => {
                const svcs = visibleServices.filter(s => s.group === group);
                if (!svcs.length) return null;
                return (
                  <div key={group} className="services-group">
                    <div className="services-group-label">{group}</div>
                    {svcs.map(s => (
                      <button key={s.id} className={`service-item ${currentService === s.id ? 'active' : ''}`}
                        onClick={() => { onNavigate(s.id); setShowServices(false); }}>
                        <span className="service-icon">{s.emoji}</span>
                        <span>{s.label}</span>
                        {s.proOnly && <span style={{ marginLeft: 'auto', fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 3, background: 'rgba(255,153,0,0.2)', color: 'var(--aws-orange)' }}>PRO</span>}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Center: search bar with Cmd+K hint */}
      <div className="topbar-center">
        <button className="palette-trigger" onClick={onOpenPalette} title="Open command palette (⌘K)">
          <Search size={13} color="var(--aws-text-muted)" />
          <span>Search services…</span>
          <kbd>⌘K</kbd>
        </button>
      </div>

      <div className="topbar-right">
        <div className="endpoint-tag">
          <span className="endpoint-region">{region}</span>
          <span className="endpoint-url">{endpoint.replace('http://', '')}</span>
        </div>

        <div className={`health-indicator ${connected ? 'connected' : 'disconnected'}`}>
          {checkingHealth ? <RefreshCw size={13} className="spin" /> : connected ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>
            {connected
              ? `${BACKENDS[health?.backend]?.logo || ''} ${BACKENDS[health?.backend]?.name || 'Connected'}`
              : 'Offline'}
          </span>
          {connected && health?.edition === 'pro' && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3,
              background: 'rgba(255,153,0,0.2)', color: 'var(--aws-orange)',
              border: '1px solid rgba(255,153,0,0.3)', letterSpacing: '0.5px' }}>PRO</span>
          )}
          <button className="refresh-btn" onClick={onRefreshHealth} title="Refresh connection" aria-label="Refresh connection">
            <RefreshCw size={11} />
          </button>
        </div>

        {/* Theme picker */}
        <div className="theme-menu" style={{ position: 'relative' }}>
          <button
            className="topbar-icon-btn"
            onClick={() => setShowTheme(v => !v)}
            title={`Theme: ${themePref}`}
            aria-label={`Theme: ${themePref}`}
          >
            <CurrentThemeIcon size={15} />
          </button>
          {showTheme && (
            <div className="theme-dropdown" onMouseLeave={() => setShowTheme(false)}>
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  className={`theme-option ${themePref === value ? 'active' : ''}`}
                  onClick={() => { setTheme(value); setShowTheme(false); }}
                >
                  <Icon size={13} />
                  {label}
                  {themePref === value && <span style={{ marginLeft: 'auto', color: 'var(--aws-orange)' }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="topbar-icon-btn" onClick={() => onNavigate('settings')} title="Settings" aria-label="Settings">
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
