import React, { useState, useEffect, useCallback } from 'react';
import { CloudCog, RefreshCw, Trash2, Eye } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { fmtDate } from '../utils/formatters';

const CF_STATUS_MAP = {
  CREATE_COMPLETE: 'green',
  UPDATE_COMPLETE: 'green',
  DELETE_COMPLETE: 'gray',
  CREATE_IN_PROGRESS: 'yellow',
  UPDATE_IN_PROGRESS: 'yellow',
  DELETE_IN_PROGRESS: 'yellow',
  ROLLBACK_COMPLETE: 'red',
  CREATE_FAILED: 'red',
  UPDATE_FAILED: 'red',
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

  // Detail view (complex nested view with tabs — keep custom)
  if (selectedStack) {
    const resourceColumns = [
      { key: 'LogicalResourceId', label: 'Logical ID', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
      { key: 'PhysicalResourceId', label: 'Physical ID', mono: true, render: (v) => <span style={{ fontSize: 11 }}>{v || '-'}</span> },
      { key: 'ResourceType', label: 'Type', render: (v) => <span className="badge badge-gray" style={{ fontSize: 10 }}>{v}</span> },
      { key: 'ResourceStatus', label: 'Status', render: (v) => <StatusBadge status={v} colorMap={CF_STATUS_MAP} /> },
    ];

    const outputColumns = [
      { key: 'OutputKey', label: 'Key', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
      { key: 'OutputValue', label: 'Value', mono: true, render: (v) => <span style={{ fontSize: 12 }}>{v}</span> },
      { key: 'Description', label: 'Description', render: (v) => <span style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{v || '-'}</span> },
    ];

    const paramColumns = [
      { key: 'ParameterKey', label: 'Key', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
      { key: 'ParameterValue', label: 'Value', mono: true, render: (v) => <span style={{ fontSize: 12 }}>{v}</span> },
    ];

    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title"><CloudCog size={20} /> {selectedStack.StackName}</div>
            <div className="page-subtitle">{resources.length} resources</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedStack(null)}>&#8592; Stacks</button>
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
                    <StatusBadge status={stackDetail.StackStatus} colorMap={CF_STATUS_MAP} />
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
          <DataTable
            columns={resourceColumns}
            data={resources}
            loading={false}
            rowKey="LogicalResourceId"
            emptyIcon={CloudCog}
            emptyTitle="No resources found"
          />
        )}

        {tab === 'outputs' && (
          <DataTable
            columns={outputColumns}
            data={stackDetail?.Outputs || []}
            loading={false}
            rowKey="OutputKey"
            emptyIcon={CloudCog}
            emptyTitle="No outputs defined in this stack"
          />
        )}

        {tab === 'parameters' && (
          <DataTable
            columns={paramColumns}
            data={stackDetail?.Parameters || []}
            loading={false}
            rowKey="ParameterKey"
            emptyIcon={CloudCog}
            emptyTitle="No parameters used in this stack"
          />
        )}
        {confirmDialog}
      </div>
    );
  }

  const stackColumns = [
    { key: 'StackName', label: 'Stack name', render: (v, row) => <button className="link-btn" onClick={() => openStack(row)}>{v}</button> },
    { key: 'StackStatus', label: 'Status', render: (v) => <StatusBadge status={v} colorMap={CF_STATUS_MAP} /> },
    { key: 'CreationTime', label: 'Created', render: (v) => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
    { key: 'LastUpdatedTime', label: 'Updated', render: (v) => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><CloudCog size={20} /> CloudFormation Stacks</div>
          <div className="page-subtitle">{stacks.length} stack{stacks.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadStacks}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
      </div>

      <DataTable
        columns={stackColumns}
        data={stacks}
        loading={loading}
        rowKey="StackId"
        emptyIcon={CloudCog}
        emptyTitle="No stacks"
        emptyDescription="Deploy CloudFormation templates to LocalStack to see them here."
        actions={(row) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => openStack(row)}><Eye size={11} /> Details</button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteStack(row.StackName)}><Trash2 size={11} /></button>
          </div>
        )}
      />

      <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;} .link-btn:hover{text-decoration:underline;}`}</style>
      {confirmDialog}
    </div>
  );
}
