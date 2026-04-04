import React, { useState, useEffect, useCallback } from 'react';
import { Key, RefreshCw, Plus, Trash2, X, Eye } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

export default function KMSPage({ showNotification }) {
  const [keys, setKeys] = useState([]);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [keyDetails, setKeyDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState({ description: '', usage: 'ENCRYPT_DECRYPT', spec: 'SYMMETRIC_DEFAULT' });
  const [selectedKey, setSelectedKey] = useState(null);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const { KMSClient, ListKeysCommand, DescribeKeyCommand } = await import('@aws-sdk/client-kms');
      const client = new KMSClient(getConfig());
      const res = await client.send(new ListKeysCommand({ Limit: 100 }));
      const ks = res.Keys || [];
      setKeys(ks);
      const details = {};
      await Promise.all(ks.slice(0, 20).map(async k => {
        try {
          const d = await client.send(new DescribeKeyCommand({ KeyId: k.KeyId }));
          details[k.KeyId] = d.KeyMetadata;
        } catch {}
      }));
      setKeyDetails(details);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const createKey = async () => {
    try {
      const { KMSClient, CreateKeyCommand } = await import('@aws-sdk/client-kms');
      const client = new KMSClient(getConfig());
      await client.send(new CreateKeyCommand({
        Description: newKey.description || 'Created via LocalStack Desktop',
        KeyUsage: newKey.usage,
        KeySpec: newKey.spec,
      }));
      showNotification('KMS key created');
      setShowCreate(false);
      setNewKey({ description: '', usage: 'ENCRYPT_DECRYPT', spec: 'SYMMETRIC_DEFAULT' });
      loadKeys();
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const scheduleDelete = (keyId) => {
    requestConfirm({
      title: `Schedule deletion of key ${keyId}? This will delete it after 7 days.`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
        const { KMSClient, ScheduleKeyDeletionCommand } = await import('@aws-sdk/client-kms');
        const client = new KMSClient(getConfig());
        await client.send(new ScheduleKeyDeletionCommand({ KeyId: keyId, PendingWindowInDays: 7 }));
        showNotification('Key deletion scheduled');
        loadKeys();
        } catch (e) { showNotification(e.message, 'error'); }

      },
    });
  };

  const stateColor = (s) => ({ Enabled: 'badge-green', Disabled: 'badge-gray', PendingDeletion: 'badge-red', PendingImport: 'badge-yellow' }[s] || 'badge-gray');
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '-';

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><Key size={20} /> KMS — Key Management</div>
          <div className="page-subtitle">{keys.length} key{keys.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadKeys}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create key</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
        : keys.length === 0 ? (
          <div className="empty-state">
            <Key size={40} /><h3>No KMS keys</h3>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create key</button>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Key ID</th><th>Alias</th><th>State</th><th>Usage</th><th>Spec</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {keys.map(k => {
                const d = keyDetails[k.KeyId];
                return (
                  <tr key={k.KeyId}>
                    <td className="mono" style={{ fontSize: 11 }}>{k.KeyId?.slice(0, 16)}...</td>
                    <td style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{d?.Description || '-'}</td>
                    <td><span className={`badge ${stateColor(d?.KeyState)}`}>{d?.KeyState || '...'}</span></td>
                    <td><span className="badge badge-gray" style={{ fontSize: 10 }}>{d?.KeyUsage || '...'}</span></td>
                    <td><span className="badge badge-blue" style={{ fontSize: 10 }}>{d?.KeySpec || '...'}</span></td>
                    <td style={{ fontSize: 12 }}>{fmtDate(d?.CreationDate)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedKey(d || k)}><Eye size={11} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => scheduleDelete(k.KeyId)}><Trash2 size={11} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Create KMS Key</span>
              <button className="close-btn" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input className="input" style={{ width: '100%' }} value={newKey.description}
                  onChange={e => setNewKey({ ...newKey, description: e.target.value })} placeholder="My encryption key" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Key Usage</label>
                <select className="input" style={{ width: '100%' }} value={newKey.usage}
                  onChange={e => setNewKey({ ...newKey, usage: e.target.value })}>
                  <option value="ENCRYPT_DECRYPT">ENCRYPT_DECRYPT</option>
                  <option value="SIGN_VERIFY">SIGN_VERIFY</option>
                  <option value="GENERATE_VERIFY_MAC">GENERATE_VERIFY_MAC</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Key Spec</label>
                <select className="input" style={{ width: '100%' }} value={newKey.spec}
                  onChange={e => setNewKey({ ...newKey, spec: e.target.value })}>
                  <option value="SYMMETRIC_DEFAULT">SYMMETRIC_DEFAULT (AES-256-GCM)</option>
                  <option value="RSA_2048">RSA_2048</option>
                  <option value="RSA_4096">RSA_4096</option>
                  <option value="ECC_NIST_P256">ECC_NIST_P256</option>
                  <option value="HMAC_256">HMAC_256</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createKey}>Create Key</button>
            </div>
          </div>
        </div>
      )}

      {selectedKey && (
        <div className="modal-overlay" onClick={() => setSelectedKey(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Key Details</span>
              <button className="close-btn" onClick={() => setSelectedKey(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <pre className="detail-json">{JSON.stringify(selectedKey, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
          {confirmDialog}
    </div>
  );
}
