import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ExternalLink, Lock, Package, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { getServiceById } from '../services/catalog';
import ServiceUnavailable, { isProOnlyError } from './ServiceUnavailable';

/**
 * GenericServicePage
 * Used for services that don't have a dedicated full page yet.
 * Shows: service description, Pro badge if needed, health status, docs links.
 * If the service is Pro-only and the user is on Community, shows the upgrade screen.
 */
export default function GenericServicePage({ serviceId, health, showNotification }) {
  const svc = getServiceById(serviceId);
  const [status, setStatus] = useState('unknown');
  const [proError, setProError] = useState(false);

  // Derive status from the health response
  useEffect(() => {
    if (!health) { setStatus('offline'); return; }
    if (health.status !== 'connected') { setStatus('offline'); return; }
    const s = health.services || {};
    const key = svc?.healthKey;
    if (!key) { setStatus('unknown'); return; }
    const val = s[key];
    if (val === 'running' || val === 'available') setStatus('running');
    else if (val === 'error') setStatus('error');
    else if (val) setStatus(val);
    else setStatus('unknown');
  }, [health, svc]);

  // If the service is proOnly and we detect it's not running, show upgrade screen
  useEffect(() => {
    if (svc?.proOnly && health?.status === 'connected' && status !== 'running') {
      // Only show pro error if service key is missing entirely from health map
      const s = health?.services || {};
      if (!s[svc.healthKey]) setProError(true);
    }
  }, [svc, health, status]);

  if (!svc) return (
    <div className="empty-state">
      <HelpCircle size={40} />
      <h3>Unknown Service</h3>
      <p>Service ID "{serviceId}" not found in catalog.</p>
    </div>
  );

  const isRunning = status === 'running';
  // Only show the upgrade screen if it's a paid-only service AND it's not running
  // (meaning the user is on the Hobby plan and doesn't have access)
  if (proError && !isRunning) return <ServiceUnavailable serviceName={svc.label} tier={svc.tier} />;

  const statusColor = {
    running: 'var(--aws-green)',
    error: 'var(--aws-red)',
    offline: 'var(--aws-red)',
    unknown: 'var(--aws-text-muted)',
  }[status] || 'var(--aws-text-muted)';
  const StatusIcon = { running: CheckCircle, error: XCircle, offline: XCircle }[status] || HelpCircle;

  return (
    <div className="fade-in" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12,
            background: 'var(--aws-surface-2)', border: '1px solid var(--aws-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            flexShrink: 0,
          }}>
            {svc.emoji}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="page-title" style={{ fontSize: 22 }}>{svc.label}</div>
              {svc.proOnly && (
                <span style={{
                  padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                  background: 'rgba(255,153,0,0.15)', color: 'var(--aws-orange)',
                  border: '1px solid rgba(255,153,0,0.3)', letterSpacing: '0.8px',
                }}>PRO</span>
              )}
            </div>
            <div className="page-subtitle" style={{ fontSize: 13 }}>{svc.sub}</div>
          </div>
        </div>
      </div>

      {/* Status card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <StatusIcon size={20} color={statusColor} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--aws-text)' }}>
                LocalStack Status
              </div>
              <div style={{ fontSize: 12, color: statusColor, marginTop: 2, textTransform: 'capitalize' }}>
                {status}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Only show tier badge, not a lock icon, when service is running */}
            <span style={{
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
              color: isRunning
                ? 'var(--aws-green)'
                : svc.proOnly ? 'var(--aws-text-muted)' : 'var(--aws-green)',
            }}>
              {isRunning
                ? <CheckCircle size={13} />
                : svc.proOnly ? <Lock size={13} /> : <Package size={13} />
              }
              {isRunning
                ? 'Available'
                : svc.proOnly
                  ? `Requires ${svc.tier === 'ultimate' ? 'Ultimate' : 'Base'}`
                  : 'Community'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">About {svc.label}</span></div>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 14, color: 'var(--aws-text-dim)', lineHeight: 1.7, marginBottom: 20 }}>
            {svc.description}
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a
              href={`https://docs.localstack.cloud/references/coverage/${svc.healthKey || svc.id}/`}
              target="_blank" rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 6, fontSize: 13,
                background: 'var(--aws-surface-3)', color: 'var(--aws-text)',
                border: '1px solid var(--aws-border)', textDecoration: 'none', fontWeight: 500,
              }}
            >
              <ExternalLink size={13} /> LocalStack Coverage Docs
            </a>
            <a
              href={`https://aws.amazon.com/${svc.id.replace('dynamodb-', 'dynamodb/').replace('-', '/')}/`}
              target="_blank" rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 6, fontSize: 13,
                background: 'var(--aws-surface-3)', color: 'var(--aws-text)',
                border: '1px solid var(--aws-border)', textDecoration: 'none', fontWeight: 500,
              }}
            >
              <ExternalLink size={13} /> AWS Documentation
            </a>
            {/* Only show upgrade button if Pro service is NOT running */}
            {svc.proOnly && !isRunning && (
              <a
                href="https://localstack.cloud/pricing"
                target="_blank" rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 6, fontSize: 13,
                  background: 'var(--aws-orange)', color: '#000',
                  textDecoration: 'none', fontWeight: 600,
                }}
              >
                View Plans <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* SDK usage hint */}
      {svc.sdkPackage && (
        <div className="card">
          <div className="card-header"><span className="card-title">AWS SDK Usage</span></div>
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 12, color: 'var(--aws-text-muted)', marginBottom: 12 }}>
              Use this service via the AWS SDK pointed at your LocalStack endpoint:
            </p>
            <pre className="detail-json">{`import { ${svc.label.replace(/\s/g, '')}Client } from '${svc.sdkPackage}';

const client = new ${svc.label.replace(/\s/g, '')}Client({
  endpoint: 'http://localhost:4566',
  region: 'us-east-1',
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
});`}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
