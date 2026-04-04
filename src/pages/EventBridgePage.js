import React, { useState, useCallback } from 'react';
import { GitBranch, RefreshCw, Plus, Trash2, Send } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import { useAwsResource } from '../hooks/useAwsResource';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import CreateModal from '../components/CreateModal';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

const STATE_COLORS = { ENABLED: 'green', DISABLED: 'gray' };

const RULE_FIELDS = [
  { name: 'name', label: 'Rule Name', required: true, placeholder: 'my-rule' },
  { name: 'pattern', label: 'Event Pattern (JSON)', type: 'textarea', defaultValue: '{"source":["my.app"]}' },
  { name: 'description', label: 'Description (optional)' },
];

const PUT_EVENT_FIELDS = [
  { name: 'source', label: 'Source', defaultValue: 'my.app', placeholder: 'my.app' },
  { name: 'type', label: 'Detail Type', defaultValue: 'MyEvent', placeholder: 'MyEvent' },
  { name: 'detail', label: 'Detail (JSON)', type: 'textarea', defaultValue: '{"key":"value"}' },
];

export default function EventBridgePage({ showNotification }) {
  const [selectedBus, setSelectedBus] = useState('default');
  const [showCreate, setShowCreate] = useState(false);
  const [showPut, setShowPut] = useState(false);
  const { confirmDialog, requestConfirm } = useConfirm();

  // We need both buses and rules, so we load them together
  const [buses, setBuses] = useState([]);

  const loadRules = useCallback(async () => {
    const { EventBridgeClient, ListEventBusesCommand, ListRulesCommand } = await import('@aws-sdk/client-eventbridge');
    const client = new EventBridgeClient(getConfig());
    const [busRes, rulesRes] = await Promise.all([
      client.send(new ListEventBusesCommand({ Limit: 100 })),
      client.send(new ListRulesCommand({ EventBusName: selectedBus, Limit: 100 })),
    ]);
    setBuses(busRes.EventBuses || []);
    return rulesRes.Rules || [];
  }, [selectedBus]);

  const { items: rules, loading, refresh } = useAwsResource(loadRules, {
    onError: (e) => showNotification(e.message, 'error'),
  });

  const createRule = async (values) => {
    if (!values.name) return;
    try {
      const { EventBridgeClient, PutRuleCommand } = await import('@aws-sdk/client-eventbridge');
      const client = new EventBridgeClient(getConfig());
      await client.send(new PutRuleCommand({
        Name: values.name,
        EventBusName: selectedBus,
        EventPattern: values.pattern,
        Description: values.description || undefined,
        State: 'ENABLED',
      }));
      showNotification(`Rule "${values.name}" created`);
      setShowCreate(false);
      refresh();
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const deleteRule = (name) => {
    requestConfirm({
      title: `Delete rule "${name}"?`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          const { EventBridgeClient, DeleteRuleCommand } = await import('@aws-sdk/client-eventbridge');
          const client = new EventBridgeClient(getConfig());
          await client.send(new DeleteRuleCommand({ Name: name, EventBusName: selectedBus }));
          showNotification('Rule deleted');
          refresh();
        } catch (e) { showNotification(e.message, 'error'); }
      },
    });
  };

  const putEvents = async (values) => {
    try {
      const { EventBridgeClient, PutEventsCommand } = await import('@aws-sdk/client-eventbridge');
      const client = new EventBridgeClient(getConfig());
      const res = await client.send(new PutEventsCommand({
        Entries: [{
          EventBusName: selectedBus,
          Source: values.source,
          DetailType: values.type,
          Detail: values.detail,
        }],
      }));
      const failed = res.FailedEntryCount || 0;
      showNotification(failed === 0 ? 'Event published' : `${failed} events failed`, failed === 0 ? 'success' : 'error');
      setShowPut(false);
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const busColumns = [
    { key: 'Name', label: 'Bus Name', render: (v) => <span style={{ fontWeight: v === selectedBus ? 600 : 400 }}>{v}</span> },
    { key: 'Arn', label: 'ARN', mono: true, render: (v) => <span style={{ fontSize: 10, color: 'var(--aws-text-muted)' }}>{v}</span> },
    { key: 'Policy', label: 'Policy', render: (v) => <span style={{ fontSize: 12 }}>{v ? 'Resource policy set' : '-'}</span> },
  ];

  const ruleColumns = [
    { key: 'Name', label: 'Rule name', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'State', label: 'State', render: (v) => <StatusBadge status={v} colorMap={STATE_COLORS} /> },
    { key: 'EventPattern', label: 'Event pattern', render: (v, row) => (
      <span className="mono" style={{ fontSize: 10, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', color: 'var(--aws-cyan)' }}>
        {v?.slice(0, 60) || row.ScheduleExpression || '-'}
      </span>
    )},
    { key: 'Description', label: 'Description', render: (v) => (
      <span style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{v || '-'}</span>
    )},
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><GitBranch size={20} /> EventBridge</div>
          <div className="page-subtitle">{buses.length} bus{buses.length !== 1 ? 'es' : ''} · {rules.length} rules</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={refresh}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-secondary" onClick={() => setShowPut(true)}><Send size={13} /> Put event</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create rule</button>
        </div>
      </div>

      {/* Bus selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: 'var(--aws-text-muted)', fontWeight: 600 }}>EVENT BUS</span>
        <select className="input" style={{ minWidth: 200 }} value={selectedBus}
          onChange={e => setSelectedBus(e.target.value)}>
          {buses.map(b => <option key={b.Name} value={b.Name}>{b.Name}</option>)}
          {buses.length === 0 && <option value="default">default</option>}
        </select>
      </div>

      {/* Event buses */}
      <div style={{ marginBottom: 16 }}>
        <div className="card-header" style={{ background: 'var(--aws-surface-3)', borderRadius: '8px 8px 0 0', border: '1px solid var(--aws-border)' }}>
          <span className="card-title">Event Buses</span>
        </div>
        <div style={{ borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
          <DataTable
            columns={busColumns}
            data={buses}
            loading={loading}
            rowKey="Name"
            emptyTitle="No event buses found"
          />
        </div>
      </div>

      {/* Rules */}
      <div>
        <div className="card-header">
          <span className="card-title">Rules on "{selectedBus}"</span>
        </div>
        <DataTable
          columns={ruleColumns}
          data={rules}
          loading={loading}
          rowKey="Name"
          emptyIcon={GitBranch}
          emptyTitle="No rules"
          emptyDescription="Rules define which events are routed to which targets."
          actions={(row) => (
            <button className="btn btn-danger btn-sm" onClick={() => deleteRule(row.Name)}><Trash2 size={11} /></button>
          )}
        />
      </div>

      <CreateModal
        title="Create EventBridge Rule"
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={createRule}
        fields={RULE_FIELDS}
        submitLabel="Create Rule"
      />

      <CreateModal
        title={`Put Event → ${selectedBus}`}
        open={showPut}
        onClose={() => setShowPut(false)}
        onSubmit={putEvents}
        fields={PUT_EVENT_FIELDS}
        submitLabel="Put Event"
      />

      {confirmDialog}
    </div>
  );
}
