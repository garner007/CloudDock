import React, { useState, useEffect, useCallback } from 'react';
import { GitBranch, RefreshCw, Plus, Trash2, X, Send } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

export default function EventBridgePage({ showNotification }) {
  const [buses, setBuses] = useState([]);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBus, setSelectedBus] = useState('default');
  const [showCreate, setShowCreate] = useState(false);
  const [showPut, setShowPut] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', pattern: '{"source":["my.app"]}', description: '' });
  const [putEvent, setPutEvent] = useState({ source: 'my.app', detail: '{"key":"value"}', type: 'MyEvent' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { EventBridgeClient, ListEventBusesCommand, ListRulesCommand } = await import('@aws-sdk/client-eventbridge');
      const client = new EventBridgeClient(getConfig());
      const [busRes, rulesRes] = await Promise.all([
        client.send(new ListEventBusesCommand({ Limit: 100 })),
        client.send(new ListRulesCommand({ EventBusName: selectedBus, Limit: 100 })),
      ]);
      setBuses(busRes.EventBuses || []);
      setRules(rulesRes.Rules || []);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification, selectedBus]);

  useEffect(() => { load(); }, [load]);

  const createRule = async () => {
    if (!newRule.name) return;
    try {
      const { EventBridgeClient, PutRuleCommand } = await import('@aws-sdk/client-eventbridge');
      const client = new EventBridgeClient(getConfig());
      await client.send(new PutRuleCommand({
        Name: newRule.name,
        EventBusName: selectedBus,
        EventPattern: newRule.pattern,
        Description: newRule.description || undefined,
        State: 'ENABLED',
      }));
      showNotification(`Rule "${newRule.name}" created`);
      setShowCreate(false);
      setNewRule({ name: '', pattern: '{"source":["my.app"]}', description: '' });
      load();
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
        showNotification('Rule deleted'); load();
        } catch (e) { showNotification(e.message, 'error'); }

      },
    });
  };

  const putEvents = async () => {
    try {
      const { EventBridgeClient, PutEventsCommand } = await import('@aws-sdk/client-eventbridge');
      const client = new EventBridgeClient(getConfig());
      const res = await client.send(new PutEventsCommand({
        Entries: [{
          EventBusName: selectedBus,
          Source: putEvent.source,
          DetailType: putEvent.type,
          Detail: putEvent.detail,
        }],
      }));
      const failed = res.FailedEntryCount || 0;
      showNotification(failed === 0 ? 'Event published' : `${failed} events failed`, failed === 0 ? 'success' : 'error');
      setShowPut(false);
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const stateColor = (s) => s === 'ENABLED' ? 'badge-green' : 'badge-gray';

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title"><GitBranch size={20} /> EventBridge</div>
          <div className="page-subtitle">{buses.length} bus{buses.length !== 1 ? 'es' : ''} · {rules.length} rules</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
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
        <div className="card" style={{ borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
          {loading ? <div className="loading-center"><RefreshCw size={14} className="spin" /></div>
          : buses.length === 0 ? <div style={{ padding: 16, color: 'var(--aws-text-muted)', fontSize: 13 }}>No event buses found</div>
          : (
            <table className="data-table">
              <thead><tr><th>Bus Name</th><th>ARN</th><th>Policy</th></tr></thead>
              <tbody>
                {buses.map(b => (
                  <tr key={b.Name} style={b.Name === selectedBus ? { background: 'rgba(255,153,0,0.05)' } : {}}>
                    <td style={{ fontWeight: b.Name === selectedBus ? 600 : 400 }}>{b.Name}</td>
                    <td className="mono" style={{ fontSize: 10, color: 'var(--aws-text-muted)' }}>{b.Arn}</td>
                    <td style={{ fontSize: 12 }}>{b.Policy ? 'Resource policy set' : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Rules */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Rules on "{selectedBus}"</span>
        </div>
        {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
        : rules.length === 0 ? (
          <div className="empty-state">
            <GitBranch size={40} /><h3>No rules</h3>
            <p>Rules define which events are routed to which targets.</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create rule</button>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Rule name</th><th>State</th><th>Event pattern</th><th>Description</th><th></th></tr></thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.Name}>
                  <td style={{ fontWeight: 500 }}>{r.Name}</td>
                  <td><span className={`badge ${stateColor(r.State)}`}>{r.State}</span></td>
                  <td className="mono" style={{ fontSize: 10, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--aws-cyan)' }}>
                    {r.EventPattern?.slice(0, 60) || r.ScheduleExpression || '-'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--aws-text-muted)' }}>{r.Description || '-'}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => deleteRule(r.Name)}><Trash2 size={11} /></button></td>
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
              <span className="modal-title">Create EventBridge Rule</span>
              <button className="close-btn" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Rule Name</label>
                <input className="input" style={{ width: '100%' }} value={newRule.name}
                  onChange={e => setNewRule({ ...newRule, name: e.target.value })} placeholder="my-rule" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Event Pattern (JSON)</label>
                <textarea className="input" style={{ width: '100%', minHeight: 90, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  value={newRule.pattern} onChange={e => setNewRule({ ...newRule, pattern: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input className="input" style={{ width: '100%' }} value={newRule.description}
                  onChange={e => setNewRule({ ...newRule, description: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createRule}>Create Rule</button>
            </div>
          </div>
        </div>
      )}

      {showPut && (
        <div className="modal-overlay" onClick={() => setShowPut(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Put Event → {selectedBus}</span>
              <button className="close-btn" onClick={() => setShowPut(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {[['Source', 'source', 'my.app'], ['Detail Type', 'type', 'MyEvent']].map(([label, key, ph]) => (
                <div key={key} className="form-group">
                  <label className="form-label">{label}</label>
                  <input className="input" style={{ width: '100%' }} value={putEvent[key]}
                    onChange={e => setPutEvent({ ...putEvent, [key]: e.target.value })} placeholder={ph} />
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Detail (JSON)</label>
                <textarea className="input" style={{ width: '100%', minHeight: 100, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  value={putEvent.detail} onChange={e => setPutEvent({ ...putEvent, detail: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPut(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={putEvents}><Send size={13} /> Put Event</button>
            </div>
          </div>
        </div>
      )}
          {confirmDialog}
    </div>
  );
}
