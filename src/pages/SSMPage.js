import React, { useState, useEffect, useCallback } from 'react';
import { SlidersHorizontal, RefreshCw, Plus, Trash2, X, Eye, EyeOff, Search } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

export default function SSMPage({ showNotification }) {
  const [params, setParams] = useState([]);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newParam, setNewParam] = useState({ name: '', value: '', type: 'String', description: '' });
  const [selectedParam, setSelectedParam] = useState(null);
  const [paramValue, setParamValue] = useState(null);
  const [showValue, setShowValue] = useState(false);
  const [search, setSearch] = useState('');
  const [pathFilter, setPathFilter] = useState('/');

  const loadParams = useCallback(async () => {
    setLoading(true);
    try {
      const { SSMClient, DescribeParametersCommand } = await import('@aws-sdk/client-ssm');
      const client = new SSMClient(getConfig());
      const res = await client.send(new DescribeParametersCommand({ MaxResults: 50 }));
      setParams(res.Parameters || []);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  useEffect(() => { loadParams(); }, [loadParams]);

  const createParam = async () => {
    if (!newParam.name || !newParam.value) return;
    try {
      const { SSMClient, PutParameterCommand } = await import('@aws-sdk/client-ssm');
      const client = new SSMClient(getConfig());
      await client.send(new PutParameterCommand({
        Name: newParam.name.startsWith('/') ? newParam.name : '/' + newParam.name,
        Value: newParam.value,
        Type: newParam.type,
        Description: newParam.description || undefined,
        Overwrite: false,
      }));
      showNotification(`Parameter created`);
      setShowCreate(false);
      setNewParam({ name: '', value: '', type: 'String', description: '' });
      loadParams();
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
        loadParams();
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

  const typeColor = (t) => t === 'SecureString' ? 'badge-red' : t === 'StringList' ? 'badge-blue' : 'badge-gray';
  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '-';

  const filteredParams = params.filter(p =>
    p.Name?.toLowerCase().includes(search.toLowerCase()) ||
    p.Description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><SlidersHorizontal size={20} /> SSM Parameter Store</div>
          <div className="page-subtitle">{params.length} parameter{params.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="search-bar">
            <Search size={13} color="var(--aws-text-muted)" />
            <input placeholder="Search parameters..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadParams}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create parameter</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
        : filteredParams.length === 0 ? (
          <div className="empty-state">
            <SlidersHorizontal size={40} /><h3>No parameters</h3>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create parameter</button>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Type</th><th>Description</th><th>Version</th><th>Last modified</th><th></th></tr></thead>
            <tbody>
              {filteredParams.map(p => (
                <tr key={p.Name}>
                  <td className="mono" style={{ fontWeight: 500, fontSize: 12 }}>{p.Name}</td>
                  <td><span className={`badge ${typeColor(p.Type)}`}>{p.Type}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{p.Description || '-'}</td>
                  <td>v{p.Version}</td>
                  <td style={{ fontSize: 12 }}>{fmtDate(p.LastModifiedDate)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => viewParam(p)}><Eye size={11} /> View</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteParam(p.Name)}><Trash2 size={11} /></button>
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
              <span className="modal-title">Create Parameter</span>
              <button className="close-btn" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Name (path)</label>
                <input className="input" style={{ width: '100%' }} value={newParam.name}
                  onChange={e => setNewParam({ ...newParam, name: e.target.value })} placeholder="/myapp/db/password" autoFocus />
                <div style={{ fontSize: 11, color: 'var(--aws-text-muted)', marginTop: 5 }}>Use hierarchical paths like /app/env/key</div>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="input" style={{ width: '100%' }} value={newParam.type}
                  onChange={e => setNewParam({ ...newParam, type: e.target.value })}>
                  <option value="String">String</option>
                  <option value="StringList">StringList</option>
                  <option value="SecureString">SecureString</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Value</label>
                <textarea className="input" style={{ width: '100%', minHeight: 80, resize: 'vertical' }}
                  value={newParam.value} onChange={e => setNewParam({ ...newParam, value: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input className="input" style={{ width: '100%' }} value={newParam.description}
                  onChange={e => setNewParam({ ...newParam, description: e.target.value })} placeholder="What this parameter is for" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createParam}>Create</button>
            </div>
          </div>
        </div>
      )}

      {selectedParam && (
        <div className="modal-overlay" onClick={() => setSelectedParam(null)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{selectedParam.Name}</span>
              <button className="close-btn" onClick={() => setSelectedParam(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <div><div className="form-label">Type</div><span className={`badge ${typeColor(selectedParam.Type)}`}>{selectedParam.Type}</span></div>
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
            </div>
          </div>
        </div>
      )}
          {confirmDialog}
    </div>
  );
}
