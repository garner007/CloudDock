import React, { useState, useEffect, useCallback } from 'react';
import { KeyRound, RefreshCw, Plus, Trash2, X, Eye, EyeOff } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

export default function SecretsPage({ showNotification }) {
  const [secrets, setSecrets] = useState([]);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newSecret, setNewSecret] = useState({ name: '', value: '', description: '' });
  const [selectedSecret, setSelectedSecret] = useState(null);
  const [secretValue, setSecretValue] = useState(null);
  const [showValue, setShowValue] = useState(false);
  const [fetchingValue, setFetchingValue] = useState(false);

  const loadSecrets = useCallback(async () => {
    setLoading(true);
    try {
      const { SecretsManagerClient, ListSecretsCommand } = await import('@aws-sdk/client-secrets-manager');
      const client = new SecretsManagerClient(getConfig());
      const res = await client.send(new ListSecretsCommand({}));
      setSecrets(res.SecretList || []);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  useEffect(() => { loadSecrets(); }, [loadSecrets]);

  const createSecret = async () => {
    try {
      const { SecretsManagerClient, CreateSecretCommand } = await import('@aws-sdk/client-secrets-manager');
      const client = new SecretsManagerClient(getConfig());
      await client.send(new CreateSecretCommand({
        Name: newSecret.name,
        SecretString: newSecret.value,
        Description: newSecret.description || undefined,
      }));
      showNotification(`Secret "${newSecret.name}" created`);
      setShowCreate(false);
      setNewSecret({ name: '', value: '', description: '' });
      loadSecrets();
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const deleteSecret = (arn, name) => {
    requestConfirm({
      title: `Delete secret "${name}"?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
        const { SecretsManagerClient, DeleteSecretCommand } = await import('@aws-sdk/client-secrets-manager');
        const client = new SecretsManagerClient(getConfig());
        await client.send(new DeleteSecretCommand({ SecretId: arn, ForceDeleteWithoutRecovery: true }));
        showNotification('Secret deleted');
        if (selectedSecret?.ARN === arn) setSelectedSecret(null);
        loadSecrets();
        } catch (e) { showNotification(e.message, 'error'); }

      },
    });
  };

  const viewSecret = async (secret) => {
    setSelectedSecret(secret);
    setSecretValue(null);
    setShowValue(false);
    setFetchingValue(true);
    try {
      const { SecretsManagerClient, GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager');
      const client = new SecretsManagerClient(getConfig());
      const res = await client.send(new GetSecretValueCommand({ SecretId: secret.ARN }));
      setSecretValue(res.SecretString || '<binary>');
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setFetchingValue(false); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '-';

  const tryFormatJson = (val) => {
    try { return JSON.stringify(JSON.parse(val), null, 2); } catch { return val; }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><KeyRound size={20} /> Secrets Manager</div>
          <div className="page-subtitle">{secrets.length} secret{secrets.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadSecrets}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Store secret</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
        ) : secrets.length === 0 ? (
          <div className="empty-state">
            <KeyRound size={40} />
            <h3>No secrets</h3>
            <p>Store your first secret.</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Store secret</button>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Secret name</th><th>Description</th><th>Last changed</th><th>Last accessed</th><th></th></tr></thead>
            <tbody>
              {secrets.map(s => (
                <tr key={s.ARN}>
                  <td style={{ fontWeight: 500 }}>{s.Name}</td>
                  <td style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{s.Description || '-'}</td>
                  <td style={{ fontSize: 12 }}>{fmtDate(s.LastChangedDate)}</td>
                  <td style={{ fontSize: 12 }}>{fmtDate(s.LastAccessedDate)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => viewSecret(s)}><Eye size={11} /> View</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteSecret(s.ARN, s.Name)}><Trash2 size={11} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Store a New Secret</span>
              <button className="close-btn" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Secret Name</label>
                <input className="input" style={{ width: '100%' }} value={newSecret.name}
                  onChange={e => setNewSecret({ ...newSecret, name: e.target.value })} placeholder="my-secret" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Secret Value</label>
                <textarea className="input" style={{ width: '100%', minHeight: 100, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  value={newSecret.value}
                  onChange={e => setNewSecret({ ...newSecret, value: e.target.value })}
                  placeholder='{"username":"admin","password":"secret"}' />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input className="input" style={{ width: '100%' }} value={newSecret.description}
                  onChange={e => setNewSecret({ ...newSecret, description: e.target.value })} placeholder="What is this secret for?" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createSecret}>Store Secret</button>
            </div>
          </div>
        </div>
      )}

      {selectedSecret && (
        <div className="modal-overlay" onClick={() => setSelectedSecret(null)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title"><KeyRound size={14} style={{ marginRight: 6 }} />{selectedSecret.Name}</span>
              <button className="close-btn" onClick={() => setSelectedSecret(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {selectedSecret.Description && (
                <div className="form-group">
                  <div className="form-label">Description</div>
                  <p style={{ fontSize: 13 }}>{selectedSecret.Description}</p>
                </div>
              )}
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div className="form-label" style={{ margin: 0 }}>Secret Value</div>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowValue(v => !v)}>
                    {showValue ? <><EyeOff size={11} /> Hide</> : <><Eye size={11} /> Reveal</>}
                  </button>
                </div>
                {fetchingValue ? (
                  <div className="loading-center"><RefreshCw size={14} className="spin" /></div>
                ) : (
                  <pre className="detail-json" style={{ filter: showValue ? 'none' : 'blur(5px)', userSelect: showValue ? 'text' : 'none' }}>
                    {secretValue ? tryFormatJson(secretValue) : '...'}
                  </pre>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12, color: 'var(--aws-text-muted)' }}>
                <div><strong>ARN:</strong><br /><span className="mono" style={{ fontSize: 10 }}>{selectedSecret.ARN}</span></div>
                <div><strong>Last Changed:</strong><br />{fmtDate(selectedSecret.LastChangedDate)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
          {confirmDialog}
    </div>
  );
}
