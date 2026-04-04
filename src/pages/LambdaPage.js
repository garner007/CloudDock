import React, { useState, useEffect, useCallback } from 'react';
import { Box, RefreshCw, Trash2, X, Play, Eye } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

export default function LambdaPage({ showNotification }) {
  const [functions, setFunctions] = useState([]);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [loading, setLoading] = useState(false);
  const [selectedFn, setSelectedFn] = useState(null);
  const [invokePayload, setInvokePayload] = useState('{}');
  const [invokeResult, setInvokeResult] = useState(null);
  const [showInvoke, setShowInvoke] = useState(false);
  const [invoking, setInvoking] = useState(false);

  const loadFunctions = useCallback(async () => {
    setLoading(true);
    try {
      const { LambdaClient, ListFunctionsCommand } = await import('@aws-sdk/client-lambda');
      const client = new LambdaClient(getConfig());
      const res = await client.send(new ListFunctionsCommand({ MaxItems: 100 }));
      setFunctions(res.Functions || []);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  useEffect(() => { loadFunctions(); }, [loadFunctions]);

  const deleteFunction = (name) => {
    requestConfirm({
      title: `Delete function "${name}"?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
        const { LambdaClient, DeleteFunctionCommand } = await import('@aws-sdk/client-lambda');
        const client = new LambdaClient(getConfig());
        await client.send(new DeleteFunctionCommand({ FunctionName: name }));
        showNotification(`Function deleted`);
        loadFunctions();
        } catch (e) { showNotification(e.message, 'error'); }

      },
    });
  };

  const invokeFunction = async () => {
    setInvoking(true);
    setInvokeResult(null);
    try {
      const { LambdaClient, InvokeCommand } = await import('@aws-sdk/client-lambda');
      const client = new LambdaClient(getConfig());
      const res = await client.send(new InvokeCommand({
        FunctionName: selectedFn.FunctionName,
        Payload: new TextEncoder().encode(invokePayload),
        LogType: 'Tail',
      }));
      const decoded = new TextDecoder().decode(res.Payload);
      const logs = res.LogResult ? atob(res.LogResult) : '';
      setInvokeResult({
        statusCode: res.StatusCode,
        payload: decoded,
        logs,
        error: res.FunctionError,
      });
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setInvoking(false); }
  };

  const runtimeColor = (rt) => {
    if (!rt) return 'badge-gray';
    if (rt.includes('python')) return 'badge-blue';
    if (rt.includes('node')) return 'badge-green';
    if (rt.includes('java')) return 'badge-yellow';
    if (rt.includes('go')) return 'badge-blue';
    return 'badge-gray';
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><Box size={20} /> Lambda Functions</div>
          <div className="page-subtitle">{functions.length} function{functions.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadFunctions}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
        ) : functions.length === 0 ? (
          <div className="empty-state">
            <Box size={40} />
            <h3>No functions</h3>
            <p>Deploy Lambda functions to LocalStack to see them here.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Function name</th><th>Runtime</th><th>Handler</th><th>Memory</th><th>Timeout</th><th>Last Modified</th><th></th></tr></thead>
            <tbody>
              {functions.map(fn => (
                <tr key={fn.FunctionName}>
                  <td>
                    <button className="link-btn" onClick={() => { setSelectedFn(fn); setShowInvoke(true); }}>
                      {fn.FunctionName}
                    </button>
                  </td>
                  <td><span className={`badge ${runtimeColor(fn.Runtime)}`}>{fn.Runtime || 'N/A'}</span></td>
                  <td className="mono" style={{ fontSize: 11 }}>{fn.Handler || '-'}</td>
                  <td>{fn.MemorySize ? `${fn.MemorySize} MB` : '-'}</td>
                  <td>{fn.Timeout ? `${fn.Timeout}s` : '-'}</td>
                  <td style={{ fontSize: 11, color: 'var(--aws-text-muted)' }}>
                    {fn.LastModified ? new Date(fn.LastModified).toLocaleDateString() : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => { setSelectedFn(fn); setInvokePayload('{}'); setInvokeResult(null); setShowInvoke(true); }}>
                        <Play size={11} /> Invoke
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedFn(fn); setShowInvoke(true); }}>
                        <Eye size={11} />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteFunction(fn.FunctionName)}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showInvoke && selectedFn && (
        <div className="modal-overlay" onClick={() => { setShowInvoke(false); setInvokeResult(null); }}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                <Play size={14} style={{ marginRight: 6 }} />
                {selectedFn.FunctionName}
              </span>
              <button className="close-btn" onClick={() => { setShowInvoke(false); setInvokeResult(null); }}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div><span className="form-label">Runtime</span><div><span className={`badge ${runtimeColor(selectedFn.Runtime)}`}>{selectedFn.Runtime}</span></div></div>
                <div><span className="form-label">Handler</span><div className="mono" style={{ fontSize: 12 }}>{selectedFn.Handler}</div></div>
                <div><span className="form-label">Memory</span><div>{selectedFn.MemorySize} MB</div></div>
                <div><span className="form-label">Timeout</span><div>{selectedFn.Timeout}s</div></div>
              </div>
              <div className="form-group">
                <label className="form-label">Invoke Payload (JSON)</label>
                <textarea className="input" style={{ width: '100%', minHeight: 100, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  value={invokePayload} onChange={e => setInvokePayload(e.target.value)} />
              </div>
              {invokeResult && (
                <div>
                  <div className="form-label" style={{ marginBottom: 6 }}>
                    Response
                    <span className={`badge ${invokeResult.error ? 'badge-red' : 'badge-green'}`} style={{ marginLeft: 8 }}>
                      {invokeResult.error ? 'Error' : `HTTP ${invokeResult.statusCode}`}
                    </span>
                  </div>
                  <pre className="detail-json" style={{ marginBottom: 12 }}>{
                    (() => { try { return JSON.stringify(JSON.parse(invokeResult.payload), null, 2); } catch { return invokeResult.payload; } })()
                  }</pre>
                  {invokeResult.logs && (
                    <>
                      <div className="form-label" style={{ marginBottom: 6 }}>Logs</div>
                      <pre className="detail-json" style={{ maxHeight: 150, fontSize: 11 }}>{invokeResult.logs}</pre>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowInvoke(false); setInvokeResult(null); }}>Close</button>
              <button className="btn btn-primary" onClick={invokeFunction} disabled={invoking}>
                {invoking ? <><RefreshCw size={13} className="spin" /> Invoking...</> : <><Play size={13} /> Invoke</>}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;} .link-btn:hover{text-decoration:underline;}`}</style>
          {confirmDialog}
    </div>
  );
}
