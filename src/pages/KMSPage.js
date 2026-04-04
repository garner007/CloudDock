import React, { useState, useCallback } from 'react';
import { Key, RefreshCw, Plus, Trash2, Eye } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import { useAwsResource } from '../hooks/useAwsResource';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import CreateModal from '../components/CreateModal';
import DetailPanel from '../components/DetailPanel';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';
import { fmtDate } from '../utils/formatters';

const STATE_COLORS = {
  Enabled: 'green', Disabled: 'gray', PendingDeletion: 'red', PendingImport: 'yellow',
};

const CREATE_FIELDS = [
  { name: 'description', label: 'Description (optional)', placeholder: 'My encryption key' },
  { name: 'usage', label: 'Key Usage', type: 'select', options: ['ENCRYPT_DECRYPT', 'SIGN_VERIFY', 'GENERATE_VERIFY_MAC'], defaultValue: 'ENCRYPT_DECRYPT' },
  { name: 'spec', label: 'Key Spec', type: 'select', options: ['SYMMETRIC_DEFAULT', 'RSA_2048', 'RSA_4096', 'ECC_NIST_P256', 'HMAC_256'], defaultValue: 'SYMMETRIC_DEFAULT' },
];

export default function KMSPage({ showNotification }) {
  const [keyDetails, setKeyDetails] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const { confirmDialog, requestConfirm } = useConfirm();

  const loadKeys = useCallback(async () => {
    const { KMSClient, ListKeysCommand, DescribeKeyCommand } = await import('@aws-sdk/client-kms');
    const client = new KMSClient(getConfig());
    const res = await client.send(new ListKeysCommand({ Limit: 100 }));
    const ks = res.Keys || [];
    const details = {};
    await Promise.all(ks.slice(0, 20).map(async k => {
      try {
        const d = await client.send(new DescribeKeyCommand({ KeyId: k.KeyId }));
        details[k.KeyId] = d.KeyMetadata;
      } catch {}
    }));
    setKeyDetails(details);
    return ks;
  }, []);

  const { items: keys, loading, refresh } = useAwsResource(loadKeys, {
    onError: (e) => showNotification(e.message, 'error'),
  });

  const createKey = async (values) => {
    try {
      const { KMSClient, CreateKeyCommand } = await import('@aws-sdk/client-kms');
      const client = new KMSClient(getConfig());
      await client.send(new CreateKeyCommand({
        Description: values.description || 'Created via LocalStack Desktop',
        KeyUsage: values.usage,
        KeySpec: values.spec,
      }));
      showNotification('KMS key created');
      setShowCreate(false);
      refresh();
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
          refresh();
        } catch (e) { showNotification(e.message, 'error'); }
      },
    });
  };

  const columns = [
    { key: 'KeyId', label: 'Key ID', mono: true, render: (v) => <span style={{ fontSize: 11 }}>{v?.slice(0, 16)}...</span> },
    { key: '_description', label: 'Alias', render: (_, row) => (
      <span style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{keyDetails[row.KeyId]?.Description || '-'}</span>
    )},
    { key: '_state', label: 'State', render: (_, row) => (
      <StatusBadge status={keyDetails[row.KeyId]?.KeyState || '...'} colorMap={STATE_COLORS} />
    )},
    { key: '_usage', label: 'Usage', render: (_, row) => (
      <span className="badge badge-gray" style={{ fontSize: 10 }}>{keyDetails[row.KeyId]?.KeyUsage || '...'}</span>
    )},
    { key: '_spec', label: 'Spec', render: (_, row) => (
      <span className="badge badge-blue" style={{ fontSize: 10 }}>{keyDetails[row.KeyId]?.KeySpec || '...'}</span>
    )},
    { key: '_created', label: 'Created', render: (_, row) => (
      <span style={{ fontSize: 12 }}>{fmtDate(keyDetails[row.KeyId]?.CreationDate)}</span>
    )},
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><Key size={20} /> KMS — Key Management</div>
          <div className="page-subtitle">{keys.length} key{keys.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={refresh}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create key</button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={keys}
        loading={loading}
        rowKey="KeyId"
        emptyIcon={Key}
        emptyTitle="No KMS keys"
        actions={(row) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedKey(keyDetails[row.KeyId] || row)}><Eye size={11} /></button>
            <button className="btn btn-danger btn-sm" onClick={() => scheduleDelete(row.KeyId)}><Trash2 size={11} /></button>
          </div>
        )}
      />

      <CreateModal
        title="Create KMS Key"
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={createKey}
        fields={CREATE_FIELDS}
        submitLabel="Create Key"
      />

      {selectedKey && (
        <DetailPanel title="Key Details" onClose={() => setSelectedKey(null)}>
          <pre className="detail-json">{JSON.stringify(selectedKey, null, 2)}</pre>
        </DetailPanel>
      )}

      {confirmDialog}
    </div>
  );
}
