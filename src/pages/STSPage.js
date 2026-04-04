import React, { useState, useCallback } from 'react';
import { Ticket, RefreshCw, Copy } from 'lucide-react';
import { STSClient, GetCallerIdentityCommand, GetSessionTokenCommand } from '@aws-sdk/client-sts';
import { getConfig } from '../services/awsClients';
import { useAwsResource } from '../hooks/useAwsResource';

export default function STSPage({ showNotification }) {
  const [sessionToken, setSessionToken] = useState(null);
  const [fetching, setFetching] = useState(false);

  const loadIdentityFn = useCallback(async () => {
    const client = new STSClient(getConfig());
    const res = await client.send(new GetCallerIdentityCommand({}));
    return res;
  }, []);

  const { items: identity, loading, refresh: loadIdentity } = useAwsResource(loadIdentityFn, {
    onError: (e) => showNotification(e.message, 'error'),
  });

  const getSessionToken = async () => {
    setFetching(true);
    try {
      const client = new STSClient(getConfig());
      const res = await client.send(new GetSessionTokenCommand({ DurationSeconds: 3600 }));
      setSessionToken(res.Credentials);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setFetching(false); }
  };

  const copy = (text) => { navigator.clipboard.writeText(text); showNotification('Copied to clipboard'); };

  const Field = ({ label, value, mono }) => (
    <div style={{ marginBottom: 16 }}>
      <div className="form-label" style={{ marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className={mono ? 'mono' : ''} style={{ fontSize: mono ? 12 : 14, color: 'var(--aws-text)', wordBreak: 'break-all' }}>
          {value || '-'}
        </div>
        {value && <button className="btn btn-secondary btn-sm" onClick={() => copy(value)}><Copy size={11} /></button>}
      </div>
    </div>
  );

  return (
    <div className="fade-in" style={{ maxWidth: 680 }}>
      <div className="page-header">
        <div>
          <div className="page-title"><Ticket size={20} /> STS — Security Token Service</div>
          <div className="page-subtitle">Caller identity and temporary credentials</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadIdentity}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">GetCallerIdentity</span></div>
        <div style={{ padding: 20 }}>
          {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
          : identity ? (
            <>
              <Field label="Account ID" value={identity.Account} mono />
              <Field label="User ARN" value={identity.Arn} mono />
              <Field label="User ID" value={identity.UserId} mono />
            </>
          ) : (
            <div style={{ color: 'var(--aws-text-muted)', fontSize: 13 }}>Failed to load identity</div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">GetSessionToken</span>
          <button className="btn btn-primary btn-sm" onClick={getSessionToken} disabled={fetching}>
            {fetching ? <><RefreshCw size={12} className="spin" /> Fetching...</> : 'Get Session Token'}
          </button>
        </div>
        <div style={{ padding: 20 }}>
          {sessionToken ? (
            <>
              <Field label="Access Key ID" value={sessionToken.AccessKeyId} mono />
              <Field label="Secret Access Key" value={sessionToken.SecretAccessKey} mono />
              <Field label="Session Token" value={sessionToken.SessionToken} mono />
              <Field label="Expiration" value={sessionToken.Expiration ? new Date(sessionToken.Expiration).toLocaleString() : '-'} />
              <div style={{ marginTop: 16 }}>
                <div className="form-label" style={{ marginBottom: 6 }}>Export as env vars</div>
                <pre className="detail-json" style={{ fontSize: 11 }}>{`export AWS_ACCESS_KEY_ID="${sessionToken.AccessKeyId}"
export AWS_SECRET_ACCESS_KEY="${sessionToken.SecretAccessKey}"
export AWS_SESSION_TOKEN="${sessionToken.SessionToken}"`}</pre>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }}
                  onClick={() => copy(`export AWS_ACCESS_KEY_ID="${sessionToken.AccessKeyId}"\nexport AWS_SECRET_ACCESS_KEY="${sessionToken.SecretAccessKey}"\nexport AWS_SESSION_TOKEN="${sessionToken.SessionToken}"`)}>
                  <Copy size={11} /> Copy export commands
                </button>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--aws-text-muted)' }}>
              Click "Get Session Token" to generate temporary credentials (valid 1 hour).
              In LocalStack these are simulated and don't expire.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
