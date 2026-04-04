import React, { useState, useCallback } from 'react';
import { Workflow, RefreshCw, Plus, Trash2, X, Play, Eye } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { useAwsResource } from '../hooks/useAwsResource';
import { useAwsAction } from '../hooks/useAwsAction';
import { fmtDate } from '../utils/formatters';

const EXEC_STATUS_MAP = {
  RUNNING: 'blue', SUCCEEDED: 'green', FAILED: 'red', TIMED_OUT: 'red', ABORTED: 'gray',
};

export default function StepFunctionsPage({ showNotification }) {
  const { confirmDialog, requestConfirm } = useConfirm();
  const [executions, setExecutions] = useState([]);
  const [execLoading, setExecLoading] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showExec, setShowExec] = useState(false);
  const [execDetail, setExecDetail] = useState(null);
  const [newMachine, setNewMachine] = useState({
    name: '',
    definition: JSON.stringify({
      Comment: 'A simple state machine',
      StartAt: 'HelloWorld',
      States: {
        HelloWorld: { Type: 'Pass', Result: 'Hello, World!', End: true }
      }
    }, null, 2),
    roleArn: 'arn:aws:iam::000000000000:role/step-functions-role',
  });
  const [execInput, setExecInput] = useState('{}');

  const loadMachinesFn = useCallback(async () => {
    const { SFNClient, ListStateMachinesCommand } = await import('@aws-sdk/client-sfn');
    const client = new SFNClient(getConfig());
    const res = await client.send(new ListStateMachinesCommand({ maxResults: 100 }));
    return res.stateMachines || [];
  }, []);

  const handleError = useCallback((e) => {
    showNotification(e.message, 'error');
  }, [showNotification]);

  const { items: machines, loading, refresh: loadMachines } = useAwsResource(loadMachinesFn, { onError: handleError });

  const loadExecutions = useCallback(async (arn) => {
    setExecLoading(true);
    try {
      const { SFNClient, ListExecutionsCommand } = await import('@aws-sdk/client-sfn');
      const client = new SFNClient(getConfig());
      const res = await client.send(new ListExecutionsCommand({ stateMachineArn: arn, maxResults: 50 }));
      setExecutions(res.executions || []);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setExecLoading(false); }
  }, [showNotification]);

  const createMachine = async () => {
    if (!newMachine.name) return;
    try {
      const { SFNClient, CreateStateMachineCommand } = await import('@aws-sdk/client-sfn');
      const client = new SFNClient(getConfig());
      await client.send(new CreateStateMachineCommand({
        name: newMachine.name,
        definition: newMachine.definition,
        roleArn: newMachine.roleArn,
        type: 'STANDARD',
      }));
      showNotification(`State machine "${newMachine.name}" created`);
      setShowCreate(false);
      setNewMachine({ ...newMachine, name: '' });
      loadMachines();
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const deleteMachine = (arn, name) => {
    requestConfirm({
      title: `Delete state machine "${name}"?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
        const { SFNClient, DeleteStateMachineCommand } = await import('@aws-sdk/client-sfn');
        const client = new SFNClient(getConfig());
        await client.send(new DeleteStateMachineCommand({ stateMachineArn: arn }));
        showNotification('State machine deleted');
        if (selectedMachine?.stateMachineArn === arn) setSelectedMachine(null);
        loadMachines();
        } catch (e) { showNotification(e.message, 'error'); }
      },
    });
  };

  const startExecution = async () => {
    try {
      const { SFNClient, StartExecutionCommand } = await import('@aws-sdk/client-sfn');
      const client = new SFNClient(getConfig());
      await client.send(new StartExecutionCommand({
        stateMachineArn: selectedMachine.stateMachineArn,
        input: execInput,
      }));
      showNotification('Execution started');
      setShowExec(false);
      loadExecutions(selectedMachine.stateMachineArn);
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const getExecDetail = async (exec) => {
    try {
      const { SFNClient, DescribeExecutionCommand } = await import('@aws-sdk/client-sfn');
      const client = new SFNClient(getConfig());
      const res = await client.send(new DescribeExecutionCommand({ executionArn: exec.executionArn }));
      setExecDetail(res);
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const openMachine = (m) => { setSelectedMachine(m); loadExecutions(m.stateMachineArn); };
  const getName = (arn) => arn?.split(':').pop() || arn;

  const executionColumns = [
    { key: 'executionArn', label: 'Execution name', render: (v) => <span style={{ fontWeight: 500, fontSize: 12 }}>{getName(v)}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} colorMap={EXEC_STATUS_MAP} /> },
    { key: 'startDate', label: 'Started', render: (v) => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
    { key: 'stopDate', label: 'Stopped', render: (v) => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
  ];

  const machineColumns = [
    { key: 'name', label: 'Name', render: (v, row) => <button className="link-btn" onClick={(e) => { e.stopPropagation(); openMachine(row); }}>{v}</button> },
    { key: 'type', label: 'Type', render: (v) => <span className="badge badge-blue">{v}</span> },
    { key: 'stateMachineArn', label: 'ARN', mono: true, render: (v) => <span style={{ fontSize: 10, color: 'var(--aws-text-muted)' }}>{v}</span> },
    { key: 'creationDate', label: 'Created', render: (v) => <span style={{ fontSize: 12 }}>{fmtDate(v)}</span> },
  ];

  if (selectedMachine) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title"><Workflow size={20} /> {selectedMachine.name}</div>
            <div className="page-subtitle">{executions.length} execution{executions.length !== 1 ? 's' : ''} · {selectedMachine.type}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedMachine(null); setExecutions([]); }}>← Machines</button>
            <button className="btn btn-secondary btn-sm" onClick={() => loadExecutions(selectedMachine.stateMachineArn)}>
              <RefreshCw size={13} className={execLoading ? 'spin' : ''} />
            </button>
            <button className="btn btn-primary" onClick={() => setShowExec(true)}><Play size={13} /> Start execution</button>
          </div>
        </div>

        <DataTable
          columns={executionColumns}
          data={executions}
          loading={execLoading}
          rowKey="executionArn"
          emptyIcon={Workflow}
          emptyTitle="No executions"
          actions={(row) => (
            <button className="btn btn-secondary btn-sm" onClick={() => getExecDetail(row)}><Eye size={11} /></button>
          )}
        />

        {showExec && (
          <div className="modal-overlay" onClick={() => setShowExec(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Start Execution — {selectedMachine.name}</span>
                <button className="close-btn" onClick={() => setShowExec(false)}><X size={16} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Input (JSON)</label>
                  <textarea className="input" style={{ width: '100%', minHeight: 120, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                    value={execInput} onChange={e => setExecInput(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowExec(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={startExecution}><Play size={13} /> Start</button>
              </div>
            </div>
          </div>
        )}

        {execDetail && (
          <div className="modal-overlay" onClick={() => setExecDetail(null)}>
            <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Execution Detail</span>
                <button className="close-btn" onClick={() => setExecDetail(null)}><X size={16} /></button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div><div className="form-label">Status</div><StatusBadge status={execDetail.status} colorMap={EXEC_STATUS_MAP} /></div>
                  <div><div className="form-label">Started</div><span style={{ fontSize: 12 }}>{fmtDate(execDetail.startDate)}</span></div>
                </div>
                {execDetail.input && <><div className="form-label" style={{ marginBottom: 6 }}>Input</div><pre className="detail-json">{(() => { try { return JSON.stringify(JSON.parse(execDetail.input), null, 2); } catch { return execDetail.input; } })()}</pre></>}
                {execDetail.output && <><div className="form-label" style={{ marginBottom: 6, marginTop: 12 }}>Output</div><pre className="detail-json">{(() => { try { return JSON.stringify(JSON.parse(execDetail.output), null, 2); } catch { return execDetail.output; } })()}</pre></>}
                {execDetail.error && <><div className="form-label" style={{ marginBottom: 6, marginTop: 12, color: 'var(--aws-red)' }}>Error</div><pre className="detail-json" style={{ color: 'var(--aws-red)' }}>{execDetail.error}: {execDetail.cause}</pre></>}
              </div>
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
          <div className="page-title"><Workflow size={20} /> Step Functions</div>
          <div className="page-subtitle">{machines.length} state machine{machines.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadMachines}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create state machine</button>
        </div>
      </div>

      <DataTable
        columns={machineColumns}
        data={machines}
        loading={loading}
        rowKey="stateMachineArn"
        emptyIcon={Workflow}
        emptyTitle="No state machines"
        actions={(row) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => openMachine(row)}>Executions</button>
            <button className="btn btn-danger btn-sm" onClick={() => deleteMachine(row.stateMachineArn, row.name)}><Trash2 size={11} /></button>
          </div>
        )}
      />

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Create State Machine</span>
              <button className="close-btn" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="input" style={{ width: '100%' }} value={newMachine.name}
                  onChange={e => setNewMachine({ ...newMachine, name: e.target.value })} placeholder="my-state-machine" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">IAM Role ARN</label>
                <input className="input" style={{ width: '100%' }} value={newMachine.roleArn}
                  onChange={e => setNewMachine({ ...newMachine, roleArn: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Definition (Amazon States Language JSON)</label>
                <textarea className="input" style={{ width: '100%', minHeight: 200, fontFamily: 'var(--font-mono)', fontSize: 11 }}
                  value={newMachine.definition} onChange={e => setNewMachine({ ...newMachine, definition: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createMachine}>Create</button>
            </div>
          </div>
        </div>
      )}
      <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;font-weight:500;} .link-btn:hover{text-decoration:underline;}`}</style>
      {confirmDialog}
    </div>
  );
}
