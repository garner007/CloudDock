import React, { useState, useEffect, useCallback } from 'react';
import { Network, RefreshCw, Plus, Trash2, X } from 'lucide-react';
import { getConfig } from '../services/awsClients';
import ConfirmDialog, { useConfirm } from '../components/ConfirmDialog';

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'PTR', 'SOA', 'SPF', 'SRV', 'TXT'];

export default function Route53Page({ showNotification }) {
  const [zones, setZones] = useState([]);
  const { confirmDialog, requestConfirm } = useConfirm();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateRecord, setShowCreateRecord] = useState(false);
  const [newZone, setNewZone] = useState({ name: '', private: false });
  const [newRecord, setNewRecord] = useState({ name: '', type: 'A', ttl: '300', value: '' });

  const loadZones = useCallback(async () => {
    setLoading(true);
    try {
      const { Route53Client, ListHostedZonesCommand } = await import('@aws-sdk/client-route-53');
      const client = new Route53Client(getConfig());
      const res = await client.send(new ListHostedZonesCommand({}));
      setZones(res.HostedZones || []);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  useEffect(() => { loadZones(); }, [loadZones]);

  const loadRecords = useCallback(async (zoneId) => {
    setLoading(true);
    try {
      const { Route53Client, ListResourceRecordSetsCommand } = await import('@aws-sdk/client-route-53');
      const client = new Route53Client(getConfig());
      const res = await client.send(new ListResourceRecordSetsCommand({ HostedZoneId: zoneId, MaxItems: '300' }));
      setRecords(res.ResourceRecordSets || []);
    } catch (e) { showNotification(e.message, 'error'); }
    finally { setLoading(false); }
  }, [showNotification]);

  const openZone = (zone) => { setSelectedZone(zone); loadRecords(zone.Id); };

  const createZone = async () => {
    if (!newZone.name) return;
    try {
      const { Route53Client, CreateHostedZoneCommand } = await import('@aws-sdk/client-route-53');
      const client = new Route53Client(getConfig());
      await client.send(new CreateHostedZoneCommand({
        Name: newZone.name,
        CallerReference: Date.now().toString(),
        HostedZoneConfig: { PrivateZone: newZone.private },
      }));
      showNotification(`Hosted zone "${newZone.name}" created`);
      setShowCreate(false);
      setNewZone({ name: '', private: false });
      loadZones();
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const deleteZone = (id, name) => {
    requestConfirm({
      title: `Delete hosted zone "${name}"? This will fail if it has records.`,
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
        const { Route53Client, DeleteHostedZoneCommand } = await import('@aws-sdk/client-route-53');
        const client = new Route53Client(getConfig());
        await client.send(new DeleteHostedZoneCommand({ Id: id }));
        showNotification('Hosted zone deleted');
        if (selectedZone?.Id === id) setSelectedZone(null);
        loadZones();
        } catch (e) { showNotification(e.message, 'error'); }

      },
    });
  };

  const createRecord = async () => {
    if (!newRecord.name || !newRecord.value) return;
    try {
      const { Route53Client, ChangeResourceRecordSetsCommand } = await import('@aws-sdk/client-route-53');
      const client = new Route53Client(getConfig());
      await client.send(new ChangeResourceRecordSetsCommand({
        HostedZoneId: selectedZone.Id,
        ChangeBatch: {
          Changes: [{
            Action: 'CREATE',
            ResourceRecordSet: {
              Name: newRecord.name,
              Type: newRecord.type,
              TTL: parseInt(newRecord.ttl),
              ResourceRecords: [{ Value: newRecord.value }],
            },
          }],
        },
      }));
      showNotification('Record created');
      setShowCreateRecord(false);
      setNewRecord({ name: '', type: 'A', ttl: '300', value: '' });
      loadRecords(selectedZone.Id);
    } catch (e) { showNotification(e.message, 'error'); }
  };

  const getZoneName = (z) => z.Name?.replace(/\.$/, '') || z.Id;
  const typeColor = (t) => ({ A: 'badge-green', AAAA: 'badge-blue', CNAME: 'badge-yellow', MX: 'badge-blue', TXT: 'badge-gray', NS: 'badge-gray', SOA: 'badge-gray' }[t] || 'badge-gray');

  if (selectedZone) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title"><Network size={20} /> {getZoneName(selectedZone)}</div>
            <div className="page-subtitle">{records.length} records · ID: {selectedZone.Id?.split('/').pop()}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedZone(null)}>← Zones</button>
            <button className="btn btn-secondary btn-sm" onClick={() => loadRecords(selectedZone.Id)}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
            <button className="btn btn-primary" onClick={() => setShowCreateRecord(true)}><Plus size={14} /> Create record</button>
          </div>
        </div>

        <div className="card">
          {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
          : records.length === 0 ? (
            <div className="empty-state"><Network size={40} /><h3>No records</h3>
              <button className="btn btn-primary" onClick={() => setShowCreateRecord(true)}><Plus size={14} /> Create record</button>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Record name</th><th>Type</th><th>TTL</th><th>Value / Routing</th></tr></thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i}>
                    <td className="mono" style={{ fontSize: 12 }}>{r.Name}</td>
                    <td><span className={`badge ${typeColor(r.Type)}`}>{r.Type}</span></td>
                    <td>{r.TTL ?? <span className="badge badge-blue">Alias</span>}</td>
                    <td className="mono" style={{ fontSize: 11 }}>
                      {r.AliasTarget ? r.AliasTarget.DNSName : (r.ResourceRecords || []).map(v => v.Value).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showCreateRecord && (
          <div className="modal-overlay" onClick={() => setShowCreateRecord(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Create DNS Record</span>
                <button className="close-btn" onClick={() => setShowCreateRecord(false)}><X size={16} /></button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Record Name</label>
                    <input className="input" style={{ width: '100%' }} value={newRecord.name}
                      onChange={e => setNewRecord({ ...newRecord, name: e.target.value })} placeholder={`www.${getZoneName(selectedZone)}`} autoFocus />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="input" style={{ width: '100%' }} value={newRecord.type}
                      onChange={e => setNewRecord({ ...newRecord, type: e.target.value })}>
                      {RECORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">TTL (seconds)</label>
                  <input className="input" style={{ width: '100%' }} type="number" value={newRecord.ttl}
                    onChange={e => setNewRecord({ ...newRecord, ttl: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Value</label>
                  <input className="input" style={{ width: '100%' }} value={newRecord.value}
                    onChange={e => setNewRecord({ ...newRecord, value: e.target.value })} placeholder="192.168.1.1" />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowCreateRecord(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={createRecord}>Create Record</button>
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
          <div className="page-title"><Network size={20} /> Route 53 Hosted Zones</div>
          <div className="page-subtitle">{zones.length} zone{zones.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadZones}><RefreshCw size={13} className={loading ? 'spin' : ''} /></button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create zone</button>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading-center"><RefreshCw size={16} className="spin" /></div>
        : zones.length === 0 ? (
          <div className="empty-state">
            <Network size={40} /><h3>No hosted zones</h3>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Create hosted zone</button>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Domain name</th><th>Zone ID</th><th>Type</th><th>Record count</th><th></th></tr></thead>
            <tbody>
              {zones.map(z => (
                <tr key={z.Id}>
                  <td><button className="link-btn" onClick={() => openZone(z)}>{getZoneName(z)}</button></td>
                  <td className="mono" style={{ fontSize: 11 }}>{z.Id?.split('/').pop()}</td>
                  <td><span className={`badge ${z.Config?.PrivateZone ? 'badge-yellow' : 'badge-blue'}`}>{z.Config?.PrivateZone ? 'Private' : 'Public'}</span></td>
                  <td>{z.ResourceRecordSetCount}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openZone(z)}>Records</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteZone(z.Id, z.Name)}><Trash2 size={11} /></button>
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
              <span className="modal-title">Create Hosted Zone</span>
              <button className="close-btn" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Domain Name</label>
                <input className="input" style={{ width: '100%' }} value={newZone.name}
                  onChange={e => setNewZone({ ...newZone, name: e.target.value })} placeholder="example.com" autoFocus
                  onKeyDown={e => e.key === 'Enter' && createZone()} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={newZone.private} onChange={e => setNewZone({ ...newZone, private: e.target.checked })} />
                <span className="form-label" style={{ margin: 0 }}>Private Zone</span>
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createZone}>Create Zone</button>
            </div>
          </div>
        </div>
      )}
      <style>{`.link-btn{background:none;border:none;color:var(--aws-cyan);cursor:pointer;font-size:13px;} .link-btn:hover{text-decoration:underline;}`}</style>
          {confirmDialog}
    </div>
  );
}
