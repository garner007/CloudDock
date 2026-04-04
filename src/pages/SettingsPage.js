import React, { useState } from 'react';
import { Settings, Save, RefreshCw, Wifi, WifiOff, Sun, Moon, Monitor,
         ExternalLink, Terminal, CheckCircle } from 'lucide-react';
import { setCredentials } from '../services/credentials';
import { clearClientCache } from '../services/awsClients';
import { BACKENDS, BACKEND_LIST, checkBackendHealth } from '../services/backends';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

const REGIONS = [
  'us-east-1','us-east-2','us-west-1','us-west-2',
  'eu-west-1','eu-west-2','eu-west-3','eu-central-1','eu-north-1',
  'ap-southeast-1','ap-southeast-2','ap-northeast-1','ap-northeast-2',
  'ap-south-1','sa-east-1','ca-central-1',
];

export default function SettingsPage({
  showNotification, health,
  themePref, setTheme,
  density, setDensity,
}) {
  const backendId = localStorage.getItem('ls_backend') || 'localstack';
  const [selectedBackend, setSelectedBackend] = useState(backendId);
  const [config, setConfig] = useState({
    endpoint:  localStorage.getItem('ls_endpoint')   || 'http://localhost:4566',
    region:    localStorage.getItem('ls_region')     || 'us-east-1',
    accessKey: localStorage.getItem('ls_access_key') || 'test',
    secretKey: localStorage.getItem('ls_secret_key') || 'test',
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const { confirmDialog, requestConfirm } = useConfirm();

  const connected = health?.status === 'connected';
  const activeBackend = BACKENDS[health?.backend] || BACKENDS[backendId] || BACKENDS.localstack;

  // When user picks a backend, pre-fill the endpoint and credentials
  const pickBackend = (id) => {
    const b = BACKENDS[id];
    setSelectedBackend(id);
    setConfig(c => ({
      ...c,
      endpoint:  b.defaultEndpoint,
      // Moto doesn't validate credentials at all; others use "test"/"test"
      accessKey: 'test',
      secretKey: 'test',
    }));
    setTestResult(null);
  };

  const save = async () => {
    localStorage.setItem('ls_backend', selectedBackend);
    await setCredentials({
      ls_endpoint:   config.endpoint,
      ls_region:     config.region,
      ls_access_key: config.accessKey,
      ls_secret_key: config.secretKey,
    });
    clearClientCache();
    showNotification('Settings saved — reconnecting…');
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await checkBackendHealth(config.endpoint, selectedBackend);
      setTestResult({ ok: result.status === 'connected', result });
    } catch (e) {
      setTestResult({ ok: false, error: e.message });
    } finally { setTesting(false); }
  };

  const resetToDefaults = () => {
    requestConfirm({
      title: 'Reset to defaults?',
      message: 'This will restore the default LocalStack connection settings.',
      confirmLabel: 'Reset',
      danger: false,
      onConfirm: () => {
        setSelectedBackend('localstack');
        setConfig({ endpoint: 'http://localhost:4566', region: 'us-east-1', accessKey: 'test', secretKey: 'test' });
        setTestResult(null);
      },
    });
  };

  return (
    <div className="fade-in" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <div>
          <div className="page-title"><Settings size={20} /> Settings</div>
          <div className="page-subtitle">
            Configure your local AWS emulator connection
          </div>
        </div>
      </div>

      {/* Current connection status */}
      <div className={`conn-banner ${connected ? 'conn-ok' : 'conn-err'}`} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {connected ? <Wifi size={18} /> : <WifiOff size={18} />}
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              {connected
                ? `Connected to ${activeBackend.name}`
                : 'Not connected'}
            </div>
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2, fontFamily: 'var(--font-mono)' }}>
              {connected
                ? `${health.endpoint}${health.version ? ` · v${health.version}` : ''}`
                : `Cannot reach ${config.endpoint}`}
            </div>
          </div>
        </div>
        {connected && (
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 12,
            background: 'rgba(0,0,0,0.15)',
          }}>
            {activeBackend.logo} {activeBackend.name}
            {health?.edition === 'pro' && ' · Pro'}
          </span>
        )}
      </div>

      {/* ── Backend selector ─────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Backend Emulator</span>
        </div>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--aws-text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
            Choose which local AWS emulator you're running. The app will use the correct
            port, detection logic, and show only services each backend supports.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {BACKEND_LIST.map(b => (
              <button
                key={b.id}
                onClick={() => pickBackend(b.id)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 6,
                  padding: '14px 16px', borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${selectedBackend === b.id ? b.color : 'var(--aws-border)'}`,
                  background: selectedBackend === b.id
                    ? `${b.color}12`
                    : 'var(--aws-surface)',
                  textAlign: 'left', fontFamily: 'var(--font-main)',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{b.logo}</span>
                  <span style={{
                    fontSize: 14, fontWeight: 700,
                    color: selectedBackend === b.id ? b.color : 'var(--aws-text)',
                  }}>
                    {b.name}
                  </span>
                  {selectedBackend === b.id && (
                    <CheckCircle size={14} color={b.color} style={{ marginLeft: 'auto' }} />
                  )}
                </div>
                <span style={{ fontSize: 11, color: 'var(--aws-text-muted)', lineHeight: 1.5 }}>
                  {b.description}
                </span>
                <div style={{ display: 'flex', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 4,
                    background: 'var(--aws-surface-3)', border: '1px solid var(--aws-border)',
                    color: 'var(--aws-text-muted)', fontFamily: 'var(--font-mono)',
                  }}>
                    :{b.defaultPort}
                  </span>
                  {!b.hasPaidTier && (
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 4,
                      background: 'rgba(29,185,84,0.1)', border: '1px solid rgba(29,185,84,0.3)',
                      color: 'var(--aws-green)',
                    }}>
                      Free / MIT
                    </span>
                  )}
                  {b.hasPaidTier && (
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 4,
                      background: 'rgba(255,153,0,0.1)', border: '1px solid rgba(255,153,0,0.3)',
                      color: 'var(--aws-orange)',
                    }}>
                      Auth token
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Quick start command for selected backend */}
          {selectedBackend && BACKENDS[selectedBackend] && (
            <div style={{ marginTop: 16 }}>
              <div className="form-label" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Terminal size={12} /> Quick start
              </div>
              <pre style={{
                padding: '10px 14px', borderRadius: 6, fontSize: 11,
                background: 'var(--aws-surface-3)', border: '1px solid var(--aws-border)',
                fontFamily: 'var(--font-mono)', color: 'var(--aws-cyan)',
                overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              }}>
                {BACKENDS[selectedBackend].dockerCmd}
              </pre>
              <a
                href={BACKENDS[selectedBackend].docsUrl}
                target="_blank" rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 12, color: 'var(--aws-text-muted)', marginTop: 8,
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={11} /> {BACKENDS[selectedBackend].name} documentation
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── Connection settings ──────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Connection</span>
        </div>
        <div style={{ padding: 20 }}>
          <div className="form-group">
            <label className="form-label">Endpoint URL</label>
            <input
              className="input" style={{ width: '100%' }}
              value={config.endpoint}
              onChange={e => setConfig(c => ({ ...c, endpoint: e.target.value }))}
              placeholder="http://localhost:4566"
              spellCheck={false}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Region</label>
            <select
              className="input" style={{ width: '100%' }}
              value={config.region}
              onChange={e => setConfig(c => ({ ...c, region: e.target.value }))}
            >
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Access Key ID</label>
              <input
                className="input" style={{ width: '100%' }}
                value={config.accessKey}
                onChange={e => setConfig(c => ({ ...c, accessKey: e.target.value }))}
                placeholder="test"
                spellCheck={false}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Secret Access Key</label>
              <input
                className="input" style={{ width: '100%' }}
                type="password"
                value={config.secretKey}
                onChange={e => setConfig(c => ({ ...c, secretKey: e.target.value }))}
                placeholder="test"
              />
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--aws-text-muted)', marginTop: 10 }}>
            {BACKENDS[selectedBackend]?.hasPaidTier
              ? 'LocalStack requires a valid auth token set as LOCALSTACK_AUTH_TOKEN in Docker. Credentials here are used by the AWS SDK.'
              : `${BACKENDS[selectedBackend]?.name} ignores credentials — any value works.`
            }
          </div>

          {/* Test result */}
          {testResult && (
            <div style={{
              marginTop: 14, padding: '10px 14px', borderRadius: 6,
              background: testResult.ok ? 'rgba(29,185,84,0.08)' : 'rgba(229,62,62,0.08)',
              border: `1px solid ${testResult.ok ? 'rgba(29,185,84,0.3)' : 'rgba(229,62,62,0.3)'}`,
              fontSize: 12,
            }}>
              {testResult.ok ? (
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--aws-green)', marginBottom: 4 }}>
                    ✓ Connected — detected: {BACKENDS[testResult.result?.backend]?.name || testResult.result?.backend}
                  </div>
                  {testResult.result?.version && (
                    <div style={{ color: 'var(--aws-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      v{testResult.result.version}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: 'var(--aws-red)' }}>
                  ✕ {testResult.error || 'Could not connect'}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={testConnection} disabled={testing}>
              {testing ? <><RefreshCw size={13} className="spin" /> Testing…</> : <><Wifi size={13} /> Test connection</>}
            </button>
            <button className="btn btn-secondary" onClick={resetToDefaults}>
              Reset to defaults
            </button>
            <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={save}>
              <Save size={13} /> Save Settings
            </button>
          </div>
        </div>
      </div>

      {/* ── Appearance ───────────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">Appearance</span></div>
        <div style={{ padding: 20 }}>
          <div className="form-group">
            <label className="form-label">Theme</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { value: 'dark',   label: 'Dark',   icon: Moon },
                { value: 'light',  label: 'Light',  icon: Sun },
                { value: 'system', label: 'System', icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme && setTheme(value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 14px', borderRadius: 6, fontSize: 13,
                    cursor: 'pointer', fontFamily: 'var(--font-main)',
                    border: `1px solid ${themePref === value ? 'var(--aws-orange)' : 'var(--aws-border)'}`,
                    background: themePref === value ? 'rgba(255,153,0,0.1)' : 'var(--aws-surface)',
                    color: themePref === value ? 'var(--aws-orange)' : 'var(--aws-text-dim)',
                    fontWeight: themePref === value ? 600 : 400,
                  }}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Table Density</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['compact', 'comfortable', 'spacious'].map(d => (
                <button
                  key={d}
                  onClick={() => setDensity && setDensity(d)}
                  style={{
                    padding: '8px 14px', borderRadius: 6, fontSize: 13,
                    cursor: 'pointer', fontFamily: 'var(--font-main)',
                    border: `1px solid ${density === d ? 'var(--aws-orange)' : 'var(--aws-border)'}`,
                    background: density === d ? 'rgba(255,153,0,0.1)' : 'var(--aws-surface)',
                    color: density === d ? 'var(--aws-orange)' : 'var(--aws-text-dim)',
                    fontWeight: density === d ? 600 : 400,
                    textTransform: 'capitalize',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── About ────────────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header"><span className="card-title">About</span></div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--aws-text-dim)' }}>LocalStack Desktop</div>
          <div style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>
            Supports LocalStack, Floci, MiniStack, and Moto server mode.
            Built with Electron + React + AWS SDK v3.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {BACKEND_LIST.map(b => (
              <a key={b.id} href={b.docsUrl} target="_blank" rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 12, padding: '4px 10px', borderRadius: 5,
                  background: 'var(--aws-surface-3)', border: '1px solid var(--aws-border)',
                  color: 'var(--aws-text-muted)', textDecoration: 'none',
                }}
              >
                {b.logo} {b.name} <ExternalLink size={10} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {confirmDialog}

      <style>{`
        .conn-banner {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px; border-radius: 8px; border: 1px solid;
        }
        .conn-ok { background: rgba(29,185,84,0.08); border-color: rgba(29,185,84,0.25); color: var(--aws-green); }
        .conn-err { background: rgba(229,62,62,0.08); border-color: rgba(229,62,62,0.25); color: var(--aws-red); }
      `}</style>
    </div>
  );
}
