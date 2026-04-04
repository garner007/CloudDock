import React, { useState, useEffect, useCallback } from 'react';
import { Globe, RefreshCw, Plus, Trash2, X, ChevronRight, ExternalLink } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

export default function APIGatewayPage({ showNotification }) {
  const [apis, setApis] = useState([]);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [resources, setResources] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedApi, setSelectedApi] = useState(null);
  const [tab, setTab] = useState('resources');
  const [showCreate, setShowCreate] = useState(false);
  const [newApi, setNewApi] = useState({ name: '', description: '' });

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

  const createApi = async () => {
    if (!newApi.name) return;
    try {
      const { APIGatewayClient, CreateRestApiCommand } = await import('@aws-sdk/client-api-gateway');
      const client = new APIGatewayClient(getConfig());
      await client.send(new CreateRestApiCommand({ name: newApi.name, description: newApi.description }));
      showNotification(`API "${newApi.name}" created`);
      setShowCreate(false);
      setNewApi({ name: '', description: '' });
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

  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '-';

  if (selectedApi) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title"><Globe size={20} /> {selectedApi.name}</div>
            <div className="page-subtitle">ID: {selectedApi.id} · {resources.length} resources · {stages.length} stages</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedApi(null)}>← APIs</button>
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
          <div className="card">
            {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
            : resources.length === 0 ? (
              <div className="empty-state"><Globe size={40} /><h3>No resources</h3></div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Path</th><th>Resource ID</th><th>Methods</th><th>Parent</th></tr></thead>
                <tbody>
                  {resources.sort((a, b) => (a.path || '').localeCompare(b.path || '')).map(r => (
                    <tr key={r.id}>
                      <td className="mono" style={{ fontWeight: 500 }}>{r.path || '/'}</td>
                      <td className="mono" style={{ fontSize: 11, color: 'var(--aws-text-muted)' }}>{r.id}</td>
                      <td>
                        {getMethods(r) !== '-' ? getMethods(r).split(', ').map(m => (
                          <span key={m} className={`badge ${m === 'GET' ? 'badge-green' : m === 'POST' ? 'badge-blue' : m === 'DELETE' ? 'badge-red' : m === 'PUT' ? 'badge-yellow' : 'badge-gray'}`} style={{ marginRight: 4, fontSize: 10 }}>{m}</span>
                        )) : <span style={{ color: 'var(--aws-text-muted)' }}>-</span>}
                      </td>
                      <td className="mono" style={{ fontSize: 11, color: 'var(--aws-text-muted)' }}>{r.parentId || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'stages' && (
          <div className="card">
            {stages.length === 0 ? (
              <div className="empty-state"><Globe size={40} /><h3>No stages</h3><p>Deploy the API to create stages.</p></div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Stage</th><th>Endpoint URL</th><th>Deployed</th></tr></thead>
                <tbody>
                  {stages.map(s => (
                    <tr key={s.stageName}>
                      <td style={{ fontWeight: 500 }}>{s.stageName}</td>
                      <td>
                        <a href={getEndpointUrl(selectedApi, s)} target="_blank" rel="noreferrer"
                          style={{ color: 'var(--aws-cyan)', fontSize: 11, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {getEndpointUrl(selectedApi, s)} <ExternalLink size={10} />
                        </a>
                      </td>
                      <td style={{ fontSize: 12 }}>{fmtDate(s.createdDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
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

      <div className="card">
        {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
        : apis.length === 0 ? (
          <div className="empty-state">
            <Globe size={40} /><h3>No APIs</h3>
            <p>Create REST APIs or deploy them to LocalStack using the CLI or CDK.</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create API</button>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>API name</th><th>API ID</th><th>Description</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {apis.map(api => (
                <tr key={api.id}>
                  <td><button className="link-btn" onClick={() => openApi(api)}>{api.name}</button></td>
                  <td className="mono" style={{ fontSize: 11 }}>{api.id}</td>
                  <td style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{api.description || '-'}</td>
                  <td style={{ fontSize: 12 }}>{fmtDate(api.createdDate)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openApi(api)}>Explore</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteApi(api.id, api.name)}><Trash2 size={11} /></button>
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
              <span className="modal-title">Create REST API</span>
              <button className="close-btn" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">API Name</label>
                <input className="input" style={{ width: '100%' }} value={newApi.name}
                  onChange={e => setNewApi({ ...newApi, name: e.target.value })} placeholder="my-api" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input className="input" style={{ width: '100%' }} value={newApi.description}
                  onChange={e => setNewApi({ ...newApi, description: e.target.value })} placeholder="My API description" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createApi}>Create API</button>
            </div>
          </div>
        </div>
      )}
      <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;} .link-btn:hover{text-decoration:underline;}`}</style>
          {confirmDialog}
    </div>
  );
}
