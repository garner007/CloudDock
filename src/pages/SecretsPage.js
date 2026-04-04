import React, { useState, useCallback } from 'react';
import { KeyRound, RefreshCw, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import { useAwsResource } from '../hooks/useAwsResource';
import DataTable from '../components/DataTable';
import CreateModal from '../components/CreateModal';
import DetailPanel from '../components/DetailPanel';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';
import { fmtDate } from '../utils/formatters';

const CREATE_FIELDS = [
  { name: 'name', label: 'Secret Name', required: true, placeholder: 'my-secret' },
  { name: 'value', label: 'Secret Value', type: 'textarea', required: true, placeholder: '{"username":"admin","password":"secret"}' },
  { name: 'description', label: 'Description (optional)', placeholder: 'What is this secret for?' },
];

export default function SecretsPage({ showNotification }) {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState(null);
  const [secretValue, setSecretValue] = useState(null);
  const [showValue, setShowValue] = useState(false);
  const [fetchingValue, setFetchingValue] = useState(false);
  const { confirmDialog, requestConfirm } = useConfirm();

  const loadSecrets = useCallback(async () => {
    const { SecretsManagerClient, ListSecretsCommand } = await import('@aws-sdk/client-secrets-manager');
    const client = new SecretsManagerClient(getConfig());
    const res = await client.send(new ListSecretsCommand({}));
    return res.SecretList || [];
  }, []);

  const { items: secrets, loading, refresh } = useAwsResource(loadSecrets, {
    onError: (e) => showNotification(e.message, 'error'),
  });

  const createSecret = async (values) => {
    try {
      const { SecretsManagerClient, CreateSecretCommand } = await import('@aws-sdk/client-secrets-manager');
      const client = new SecretsManagerClient(getConfig());
      await client.send(new CreateSecretCommand({
        Name: values.name,
        SecretString: values.value,
        Description: values.description || undefined,
      }));
      showNotification(`Secret "${values.name}" created`);
      setShowCreate(false);
      refresh();
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
          refresh();
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

  const tryFormatJson = (val) => {
    try { return JSON.stringify(JSON.parse(val), null, 2); } catch { return val; }
  };

  const columns = [
    { key: 'Name', label: 'Secret name', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'Description', label: 'Description', render: (v) => (
      <span style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{v || '-'}</span>
    )},
    { key: 'LastChangedDate', label: 'Last changed', render: (v) => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
    { key: 'LastAccessedDate', label: 'Last accessed', render: (v) => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><KeyRound size={20} /> Secrets Manager</div>
          <div className="page-subtitle">{secrets.length} secret{secrets.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={refresh}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Store secret</button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={secrets}
        loading={loading}
        rowKey="ARN"
        emptyIcon={KeyRound}
        emptyTitle="No secrets"
        emptyDescription="Store your first secret."
        actions={(row) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => viewSecret(row)}><Eye size={11} /> View</button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteSecret(row.ARN, row.Name)}><Trash2 size={11} /></button>
          </div>
        )}
      />

      <CreateModal
        title="Store a New Secret"
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={createSecret}
        fields={CREATE_FIELDS}
        submitLabel="Store Secret"
      />

      {selectedSecret && (
        <DetailPanel title={selectedSecret.Name} onClose={() => setSelectedSecret(null)}>
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
        </DetailPanel>
      )}

      {confirmDialog}
    </div>
  );
}
