import React from 'react';
import { Lock, ExternalLink } from 'lucide-react';

export function isProOnlyError(err) {
  if (!err) return false;
  const msg = (err.message || err.toString()).toLowerCase();
  return (
    msg.includes('not available') || msg.includes('pro feature') ||
    msg.includes('subscribe') || msg.includes('activation') ||
    msg.includes('license') || msg.includes('connection refused') ||
    msg.includes('econnrefused') || msg.includes('501') ||
    msg.includes('notimplementederror') || msg.includes('internalfailure')
  );
}

export default function ServiceUnavailable({ serviceName, tier = 'base' }) {
  const tierLabel = tier === 'ultimate' ? 'Ultimate' : 'Base';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '80px 40px', gap: 16, textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'rgba(255,153,0,0.1)', border: '2px solid rgba(255,153,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Lock size={28} color="var(--aws-orange)" />
      </div>
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--aws-text)', marginBottom: 8 }}>
          {serviceName} requires LocalStack {tierLabel}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--aws-text-muted)', maxWidth: 380, lineHeight: 1.6 }}>
          This service is not available on the Hobby (free) plan.
          Upgrade to <strong style={{ color: 'var(--aws-orange)' }}>{tierLabel}</strong> or higher to use {serviceName},
          or start LocalStack with your auth token.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <a href="https://localstack.cloud/pricing" target="_blank" rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
            background: 'var(--aws-orange)', color: '#000', textDecoration: 'none',
          }}>
          View Plans <ExternalLink size={12} />
        </a>
        <a href="https://docs.localstack.cloud/aws/getting-started/auth-token/" target="_blank" rel="noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
            background: 'var(--aws-surface-3)', color: 'var(--aws-text)',
            border: '1px solid var(--aws-border)', textDecoration: 'none',
          }}>
          Activate Auth Token <ExternalLink size={12} />
        </a>
      </div>
      <div style={{
        marginTop: 8, padding: '12px 20px', borderRadius: 8,
        background: 'var(--aws-surface-2)', border: '1px solid var(--aws-border)',
        fontSize: 12, color: 'var(--aws-text-muted)', fontFamily: 'var(--font-mono)',
      }}>
        LOCALSTACK_AUTH_TOKEN=ls-xxx localstack start
      </div>
    </div>
  );
}
