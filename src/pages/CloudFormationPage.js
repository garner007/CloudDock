import React, { useState, useEffect, useCallback } from 'react';
import { CloudCog, RefreshCw, Trash2, X, Eye } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

const STATUS_BADGE = {
  'CREATE_COMPLETE': 'badge-green',
  'UPDATE_COMPLETE': 'badge-green',
  'DELETE_COMPLETE': 'badge-gray',
  'CREATE_IN_PROGRESS': 'badge-yellow',
  'UPDATE_IN_PROGRESS': 'badge-yellow',
  'DELETE_IN_PROGRESS': 'badge-yellow',
  'ROLLBACK_COMPLETE': 'badge-red',
  'CREATE_FAILED': 'badge-red',
  'UPDATE_FAILED': 'badge-red',
};

export default function CloudFormationPage({ showNotification }) {
  const [stacks, setStacks] = useState([]);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [loading, setLoading] = useState(false);
  const [selectedStack, setSelectedStack] = useState(null);
  const [stackDetail, setStackDetail] = useState(null);
  const [resources, setResources] = useState([]);
  const [tab, setTab] = useState('overview');

  const loadStacks = useCallback(async () => {
    setLoading(true);
    try {
      const { CloudFormationClient, ListStacksCommand } = await import('@aws-sdk/client-cloudformation');
      const client = new CloudFormationClient(getConfig());
      const res = await client.send(new ListStacksCommand({
        StackStatusFilter: [
          'CREATE_COMPLETE', 'UPDATE_COMPLETE', 'CREATE_IN_PROGRESS',
          'UPDATE_IN_PROGRESS', 'ROLLBACK_COMPLETE', 'CREATE_FAILED',
        ],
      }));
      setStacks(res.StackSummaries || []);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  useEffect(() => { loadStacks(); }, [loadStacks]);

  const openStack = async (stack) => {
    setSelectedStack(stack);
    setTab('overview');
    setLoading(true);
    try {
      const { CloudFormationClient, DescribeStacksCommand, ListStackResourcesCommand } = await import('@aws-sdk/client-cloudformation');
      const client = new CloudFormationClient(getConfig());
      const [d, r] = await Promise.all([
        client.send(new DescribeStacksCommand({ StackName: stack.StackName })),
        client.send(new ListStackResourcesCommand({ StackName: stack.StackName })),
      ]);
      setStackDetail(d.Stacks?.[0]);
      setResources(r.StackResourceSummaries || []);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const deleteStack = (name) => {
    requestConfirm({
      title: `Delete stack "${name}"?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
        const { CloudFormationClient, DeleteStackCommand } = await import('@aws-sdk/client-cloudformation');
        const client = new CloudFormationClient(getConfig());
        await client.send(new DeleteStackCommand({ StackName: name }));
        showNotification(`Stack "${name}" deletion initiated`);
        if (selectedStack?.StackName === name) setSelectedStack(null);
        loadStacks();
        } catch (e) { showNotification(e.message, 'error'); }

      },
    });
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '-';

  if (selectedStack) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title"><CloudCog size={20} /> {selectedStack.StackName}</div>
            <div className="page-subtitle">{resources.length} resources</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedStack(null)}>← Stacks</button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteStack(selectedStack.StackName)}>
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>

        <div className="tab-bar">
          {['overview', 'resources', 'outputs', 'parameters'].map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'overview' && stackDetail && (
          <div className="card">
            <div style={{ padding: 20 }}>
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-label">Status</div>
                  <div style={{ marginTop: 8 }}>
                    <span className={`badge ${STATUS_BADGE[stackDetail.StackStatus] || 'badge-gray'}`}>
                      {stackDetail.StackStatus}
                    </span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Resources</div>
                  <div className="stat-value">{resources.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Outputs</div>
                  <div className="stat-value">{stackDetail.Outputs?.length || 0}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Created</div>
                  <div style={{ fontSize: 12, marginTop: 6 }}>{fmtDate(stackDetail.CreationTime)}</div>
                </div>
              </div>
              {stackDetail.Description && (
                <div>
                  <div className="form-label" style={{ marginBottom: 6 }}>Description</div>
                  <p style={{ fontSize: 13, color: 'var(--aws-text-dim)' }}>{stackDetail.Description}</p>
                </div>
              )}
              {stackDetail.StackStatusReason && (
                <div style={{ marginTop: 16 }}>
                  <div className="form-label" style={{ marginBottom: 6 }}>Status Reason</div>
                  <p style={{ fontSize: 13, color: 'var(--aws-text-dim)' }}>{stackDetail.StackStatusReason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'resources' && (
          <div className="card">
            {resources.length === 0 ? (
              <div className="empty-state"><CloudCog size={30} /><p>No resources found.</p></div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Logical ID</th><th>Physical ID</th><th>Type</th><th>Status</th></tr></thead>
                <tbody>
                  {resources.map(r => (
                    <tr key={r.LogicalResourceId}>
                      <td style={{ fontWeight: 500 }}>{r.LogicalResourceId}</td>
                      <td className="mono" style={{ fontSize: 11 }}>{r.PhysicalResourceId || '-'}</td>
                      <td><span className="badge badge-gray" style={{ fontSize: 10 }}>{r.ResourceType}</span></td>
                      <td><span className={`badge ${STATUS_BADGE[r.ResourceStatus] || 'badge-gray'}`}>{r.ResourceStatus}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'outputs' && (
          <div className="card">
            {!stackDetail?.Outputs?.length ? (
              <div className="empty-state"><CloudCog size={30} /><p>No outputs defined in this stack.</p></div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Key</th><th>Value</th><th>Description</th></tr></thead>
                <tbody>
                  {stackDetail.Outputs.map(o => (
                    <tr key={o.OutputKey}>
                      <td style={{ fontWeight: 500 }}>{o.OutputKey}</td>
                      <td className="mono" style={{ fontSize: 12 }}>{o.OutputValue}</td>
                      <td style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{o.Description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'parameters' && (
          <div className="card">
            {!stackDetail?.Parameters?.length ? (
              <div className="empty-state"><CloudCog size={30} /><p>No parameters used in this stack.</p></div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Key</th><th>Value</th></tr></thead>
                <tbody>
                  {stackDetail.Parameters.map(p => (
                    <tr key={p.ParameterKey}>
                      <td style={{ fontWeight: 500 }}>{p.ParameterKey}</td>
                      <td className="mono" style={{ fontSize: 12 }}>{p.ParameterValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
          <div className="page-title"><CloudCog size={20} /> CloudFormation Stacks</div>
          <div className="page-subtitle">{stacks.length} stack{stacks.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadStacks}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
        ) : stacks.length === 0 ? (
          <div className="empty-state">
            <CloudCog size={40} />
            <h3>No stacks</h3>
            <p>Deploy CloudFormation templates to LocalStack to see them here.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Stack name</th><th>Status</th><th>Created</th><th>Updated</th><th></th></tr></thead>
            <tbody>
              {stacks.map(s => (
                <tr key={s.StackId}>
                  <td>
                    <button className="link-btn" onClick={() => openStack(s)}>{s.StackName}</button>
                  </td>
                  <td><span className={`badge ${STATUS_BADGE[s.StackStatus] || 'badge-gray'}`}>{s.StackStatus}</span></td>
                  <td style={{ fontSize: 12 }}>{fmtDate(s.CreationTime)}</td>
                  <td style={{ fontSize: 12 }}>{fmtDate(s.LastUpdatedTime)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openStack(s)}><Eye size={11} /> Details</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteStack(s.StackName)}><Trash2 size={11} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;} .link-btn:hover{text-decoration:underline;}`}</style>
          {confirmDialog}
    </div>
  );
}
