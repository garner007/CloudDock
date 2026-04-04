import React, { useState, useEffect, useCallback } from 'react';
import { Globe, RefreshCw, Plus, Trash2, ExternalLink } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';
import DataTable from '../components/DataTable';
import CreateModal from '../components/CreateModal';
import { fmtDate } from '../utils/formatters';

export default function APIGatewayPage({ showNotification }) {
  const [apis, setApis] = useState([]);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [resources, setResources] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedApi, setSelectedApi] = useState(null);
  const [tab, setTab] = useState('resources');
  const [showCreate, setShowCreate] = useState(false);

  const loadApis = useCallback(async () => {
    setLoading(true);
    try {
      const { APIGatewayClient, GetRestApisCommand } = await import('@aws-sdk/client-api-gateway');
      const client = new APIGatewayClient(getConfig());
      const res = await client.send(new GetRestApisCommand({ limit: 100 }));
      setApis(res.items || []);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  useEffect(() => { loadApis(); }, [loadApis]);

  const openApi = async (api) => {
    setSelectedApi(api);
    setTab('resources');
    setLoading(true);
    try {
      const { APIGatewayClient, GetResourcesCommand, GetStagesCommand } = await import('@aws-sdk/client-api-gateway');
      const client = new APIGatewayClient(getConfig());
      const [r, s] = await Promise.all([
        client.send(new GetResourcesCommand({ restApiId: api.id, limit: 100 })),
        client.send(new GetStagesCommand({ restApiId: api.id })),
      ]);
      setResources(r.items || []);
      setStages(s.item || []);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const createApi = async (values) => {
    if (!values.name) return;
    try {
      const { APIGatewayClient, CreateRestApiCommand } = await import('@aws-sdk/client-api-gateway');
      const client = new APIGatewayClient(getConfig());
      await client.send(new CreateRestApiCommand({ name: values.name, description: values.description }));
      showNotification(`API "${values.name}" created`);
      setShowCreate(false);
      loadApis();
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const deleteApi = (id, name) => {
    requestConfirm({
      title: `Delete API "${name}"?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
        const { APIGatewayClient, DeleteRestApiCommand } = await import('@aws-sdk/client-api-gateway');
        const client = new APIGatewayClient(getConfig());
        await client.send(new DeleteRestApiCommand({ restApiId: id }));
        showNotification('API deleted');
        if (selectedApi?.id === id) setSelectedApi(null);
        loadApis();
        } catch (e) { showNotification(e.message, 'error'); }

      },
    });
  };

  const getEndpointUrl = (api, stage) => {
    const cfg = getConfig();
    return `${cfg.endpoint}/restapis/${api.id}/${stage.stageName}/_user_request_`;
  };

  const getMethods = (resource) => Object.keys(resource.resourceMethods || {}).join(', ') || '-';

  // Detail view (complex nested view with tabs — keep custom)
  if (selectedApi) {
    const resourceColumns = [
      { key: 'path', label: 'Path', mono: true, render: (v) => <span style={{ fontWeight: 500 }}>{v || '/'}</span> },
      { key: 'id', label: 'Resource ID', mono: true, render: (v) => <span style={{ fontSize: 11, color: 'var(--aws-text-muted)' }}>{v}</span> },
      { key: '_methods', label: 'Methods', render: (_, row) => {
        const methods = getMethods(row);
        return methods !== '-' ? methods.split(', ').map(m => (
          <span key={m} className={`badge ${m === 'GET' ? 'badge-green' : m === 'POST' ? 'badge-blue' : m === 'DELETE' ? 'badge-red' : m === 'PUT' ? 'badge-yellow' : 'badge-gray'}`} style={{ marginRight: 4, fontSize: 10 }}>{m}</span>
        )) : <span style={{ color: 'var(--aws-text-muted)' }}>-</span>;
      }},
      { key: 'parentId', label: 'Parent', mono: true, render: (v) => <span style={{ fontSize: 11, color: 'var(--aws-text-muted)' }}>{v || '-'}</span> },
    ];

    const stageColumns = [
      { key: 'stageName', label: 'Stage', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
      { key: '_endpoint', label: 'Endpoint URL', render: (_, row) => (
        <a href={getEndpointUrl(selectedApi, row)} target="_blank" rel="noreferrer"
          style={{ color: 'var(--aws-cyan)', fontSize: 11, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {getEndpointUrl(selectedApi, row)} <ExternalLink size={10} />
        </a>
      )},
      { key: 'createdDate', label: 'Deployed', render: (v) => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
    ];

    // Sort resources by path for display
    const sortedResources = [...resources].sort((a, b) => (a.path || '').localeCompare(b.path || ''));

    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title"><Globe size={20} /> {selectedApi.name}</div>
            <div className="page-subtitle">ID: {selectedApi.id} · {resources.length} resources · {stages.length} stages</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedApi(null)}>&#8592; APIs</button>
            <button className="btn btn-secondary btn-sm" onClick={() => openApi(selectedApi)}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          </div>
        </div>

        <div className="tab-bar">
          {['resources', 'stages', 'details'].map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'resources' && (
          <DataTable
            columns={resourceColumns}
            data={sortedResources}
            loading={loading}
            rowKey="id"
            emptyIcon={Globe}
            emptyTitle="No resources"
          />
        )}

        {tab === 'stages' && (
          <DataTable
            columns={stageColumns}
            data={stages}
            loading={false}
            rowKey="stageName"
            emptyIcon={Globe}
            emptyTitle="No stages"
            emptyDescription="Deploy the API to create stages."
          />
        )}

        {tab === 'details' && (
          <div className="card">
            <div style={{ padding: 20 }}>
              <div className="stats-row">
                <div className="stat-card"><div className="stat-label">API ID</div><div className="mono" style={{ fontSize: 11, marginTop: 6 }}>{selectedApi.id}</div></div>
                <div className="stat-card"><div className="stat-label">Resources</div><div className="stat-value">{resources.length}</div></div>
                <div className="stat-card"><div className="stat-label">Stages</div><div className="stat-value">{stages.length}</div></div>
                <div className="stat-card"><div className="stat-label">Created</div><div style={{ fontSize: 12, marginTop: 6 }}>{fmtDate(selectedApi.createdDate)}</div></div>
              </div>
              {selectedApi.description && (
                <div>
                  <div className="form-label" style={{ marginBottom: 6 }}>Description</div>
                  <p style={{ fontSize: 13 }}>{selectedApi.description}</p>
                </div>
              )}
              <div className="form-label" style={{ marginBottom: 6, marginTop: 16 }}>Endpoint Configuration</div>
              <pre className="detail-json">{JSON.stringify(selectedApi.endpointConfiguration || {}, null, 2)}</pre>
            </div>
          </div>
        )}
        {confirmDialog}
      </div>
    );
  }

  const apiColumns = [
    { key: 'name', label: 'API name', render: (v, row) => <button className="link-btn" onClick={() => openApi(row)}>{v}</button> },
    { key: 'id', label: 'API ID', mono: true, render: (v) => <span style={{ fontSize: 11 }}>{v}</span> },
    { key: 'description', label: 'Description', render: (v) => <span style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{v || '-'}</span> },
    { key: 'createdDate', label: 'Created', render: (v) => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><Globe size={20} /> API Gateway</div>
          <div className="page-subtitle">{apis.length} REST API{apis.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadApis}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create API</button>
        </div>
      </div>

      <DataTable
        columns={apiColumns}
        data={apis}
        loading={loading}
        rowKey="id"
        emptyIcon={Globe}
        emptyTitle="No APIs"
        emptyDescription="Create REST APIs or deploy them to LocalStack using the CLI or CDK."
        actions={(row) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => openApi(row)}>Explore</button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteApi(row.id, row.name)}><Trash2 size={11} /></button>
          </div>
        )}
      />

      <CreateModal
        title="Create REST API"
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={createApi}
        fields={[
          { name: 'name', label: 'API Name', required: true, placeholder: 'my-api' },
          { name: 'description', label: 'Description (optional)', placeholder: 'My API description' },
        ]}
        submitLabel="Create API"
      />

      <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;} .link-btn:hover{text-decoration:underline;}`}</style>
      {confirmDialog}
    </div>
  );
}
