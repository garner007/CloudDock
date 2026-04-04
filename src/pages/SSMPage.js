import React, { useState, useCallback } from 'react';
import { SlidersHorizontal, RefreshCw, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import { useAwsResource } from '../hooks/useAwsResource';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import CreateModal from '../components/CreateModal';
import DetailPanel from '../components/DetailPanel';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';
import { fmtDate } from '../utils/formatters';

const TYPE_COLORS = { SecureString: 'red', StringList: 'blue', String: 'gray' };

const CREATE_FIELDS = [
  { name: 'name', label: 'Name (path)', required: true, placeholder: '/myapp/db/password', helpText: 'Use hierarchical paths like /app/env/key' },
  { name: 'type', label: 'Type', type: 'select', options: ['String', 'StringList', 'SecureString'], defaultValue: 'String' },
  { name: 'value', label: 'Value', type: 'textarea', required: true },
  { name: 'description', label: 'Description (optional)', placeholder: 'What this parameter is for' },
];

export default function SSMPage({ showNotification }) {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedParam, setSelectedParam] = useState(null);
  const [paramValue, setParamValue] = useState(null);
  const [showValue, setShowValue] = useState(false);
  const { confirmDialog, requestConfirm } = useConfirm();

  const loadParams = useCallback(async () => {
    const { SSMClient, DescribeParametersCommand } = await import('@aws-sdk/client-ssm');
    const client = new SSMClient(getConfig());
    const res = await client.send(new DescribeParametersCommand({ MaxResults: 50 }));
    return res.Parameters || [];
  }, []);

  const { items: params, loading, refresh } = useAwsResource(loadParams, {
    onError: (e) => showNotification(e.message, 'error'),
  });

  const createParam = async (values) => {
    if (!values.name || !values.value) return;
    try {
      const { SSMClient, PutParameterCommand } = await import('@aws-sdk/client-ssm');
      const client = new SSMClient(getConfig());
      await client.send(new PutParameterCommand({
        Name: values.name.startsWith('/') ? values.name : '/' + values.name,
        Value: values.value,
        Type: values.type,
        Description: values.description || undefined,
        Overwrite: false,
      }));
      showNotification('Parameter created');
      setShowCreate(false);
      refresh();
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const deleteParam = (name) => {
    requestConfirm({
      title: `Delete parameter "${name}"?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          const { SSMClient, DeleteParameterCommand } = await import('@aws-sdk/client-ssm');
          const client = new SSMClient(getConfig());
          await client.send(new DeleteParameterCommand({ Name: name }));
          showNotification('Parameter deleted');
          if (selectedParam?.Name === name) setSelectedParam(null);
          refresh();
        } catch (e) { showNotification(e.message, 'error'); }
      },
    });
  };

  const viewParam = async (param) => {
    setSelectedParam(param);
    setParamValue(null);
    setShowValue(false);
    try {
      const { SSMClient, GetParameterCommand } = await import('@aws-sdk/client-ssm');
      const client = new SSMClient(getConfig());
      const res = await client.send(new GetParameterCommand({ Name: param.Name, WithDecryption: true }));
      setParamValue(res.Parameter?.Value || '');
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const columns = [
    { key: 'Name', label: 'Name', mono: true, render: (v) => <span style={{ fontWeight: 500, fontSize: 12 }}>{v}</span> },
    { key: 'Type', label: 'Type', render: (v) => <StatusBadge status={v} colorMap={TYPE_COLORS} /> },
    { key: 'Description', label: 'Description', render: (v) => (
      <span style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{v || '-'}</span>
    )},
    { key: 'Version', label: 'Version', render: (v) => `v${v}` },
    { key: 'LastModifiedDate', label: 'Last modified', render: (v) => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><SlidersHorizontal size={20} /> SSM Parameter Store</div>
          <div className="page-subtitle">{params.length} parameter{params.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={refresh}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create parameter</button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={params}
        loading={loading}
        rowKey="Name"
        searchable
        searchPlaceholder="Search parameters..."
        searchKeys={['Name', 'Description']}
        emptyIcon={SlidersHorizontal}
        emptyTitle="No parameters"
        actions={(row) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => viewParam(row)}><Eye size={11} /> View</button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteParam(row.Name)}><Trash2 size={11} /></button>
          </div>
        )}
      />

      <CreateModal
        title="Create Parameter"
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={createParam}
        fields={CREATE_FIELDS}
        submitLabel="Create"
      />

      {selectedParam && (
        <DetailPanel title={selectedParam.Name} onClose={() => setSelectedParam(null)}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div><div className="form-label">Type</div><StatusBadge status={selectedParam.Type} colorMap={TYPE_COLORS} /></div>
            <div><div className="form-label">Version</div>v{selectedParam.Version}</div>
            <div><div className="form-label">Last Modified</div><span style={{ fontSize: 12 }}>{fmtDate(selectedParam.LastModifiedDate)}</span></div>
          </div>
          {selectedParam.Description && (
            <div className="form-group"><div className="form-label">Description</div><p style={{ fontSize: 13 }}>{selectedParam.Description}</p></div>
          )}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div className="form-label" style={{ margin: 0 }}>Value</div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowValue(v => !v)}>
                {showValue ? <><EyeOff size={11} /> Hide</> : <><Eye size={11} /> Reveal</>}
              </button>
            </div>
            <pre className="detail-json" style={{ filter: showValue || selectedParam.Type !== 'SecureString' ? 'none' : 'blur(5px)' }}>
              {paramValue !== null ? paramValue : 'Loading...'}
            </pre>
          </div>
        </DetailPanel>
      )}

      {confirmDialog}
    </div>
  );
}
